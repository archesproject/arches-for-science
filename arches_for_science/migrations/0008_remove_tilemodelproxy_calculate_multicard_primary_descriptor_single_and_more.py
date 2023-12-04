# Generated by Django 4.2.4 on 2023-12-04 08:47

from django.db import migrations
import pgtrigger.compiler
import pgtrigger.migrations


class Migration(migrations.Migration):
    dependencies = [
        ("arches_for_science", "0007_update_primary_description_trigger_handle_static_value"),
    ]

    operations = [
        pgtrigger.migrations.RemoveTrigger(
            model_name="tilemodelproxy",
            name="calculate_multicard_primary_descriptor_single",
        ),
        pgtrigger.migrations.AddTrigger(
            model_name="tilemodelproxy",
            trigger=pgtrigger.compiler.Trigger(
                name="calculate_multicard_primary_descriptor_single",
                sql=pgtrigger.compiler.UpsertTriggerSql(
                    func="\nDECLARE\n    fn_config jsonb;\n    name_template text;\n    map_popup_template text;\n    description_template text;\n    all_templates text[];\n    this_template text;\n    loop_index int;\n    descriptor_key text;\n\n    graph UUID;\n    resourceid UUID;\n    node_alias text;\n    alias_with_separators text;\n    node_for_alias UUID;\n    nodegroup_for_alias UUID;\n    localized_string_node_value jsonb;\n    lang text;\n    inner18n_obj_for_lang jsonb;\n    resolved_node_value_for_lang text;\n    resolved_node_values_by_descriptor text;\n    working_string text;\n    localized_result_all jsonb;\n    localized_result_name_only jsonb;\n    sample_localized_name jsonb;\n\nBEGIN\n\nSELECT NEW.resourceinstanceid INTO resourceid;\nSELECT graphid INTO graph FROM resource_instances WHERE resourceinstanceid = resourceid;\n\nSELECT config\nINTO fn_config\nFROM functions_x_graphs\nWHERE\n    functionid = '00b2d15a-fda0-4578-b79a-784e4138664b'\n    AND functions_x_graphs.config IS NOT NULL\n    AND graph = graphid;\n\nIF FOUND THEN\n\n    SELECT JSONB_OBJECT('{}') INTO localized_result_all;\n    SELECT JSONB_OBJECT('{}') INTO localized_result_name_only;\n    SELECT fn_config -> 'descriptor_types' -> 'name' -> 'string_template' INTO name_template;\n    SELECT fn_config -> 'descriptor_types' -> 'map_popup' -> 'string_template' INTO map_popup_template;\n    SELECT fn_config -> 'descriptor_types' -> 'description' -> 'string_template' INTO description_template;\n\n    SELECT ARRAY[name_template, map_popup_template, description_template] INTO all_templates;\n    SELECT 0 INTO loop_index;\n    FOR this_template IN SELECT UNNEST(all_templates)\n    LOOP\n        SELECT loop_index + 1 INTO loop_index;\n        SELECT\n        CASE\n            WHEN loop_index = 1 THEN 'name'\n            WHEN loop_index = 2 THEN 'map_popup'\n            ELSE 'description'\n        END\n        INTO descriptor_key;\n\n        -- Remove outer quotes from template\n        SELECT TRIM(this_template, '\"') INTO this_template;\n        -- Unescape some characters before doing string replacement\n        SELECT REPLACE(this_template, '\\\"', '\"') INTO this_template;\n\n        -- Resolve node values to localized strings\n        FOR alias_with_separators IN SELECT UNNEST(REGEXP_MATCHES(this_template, '<\\w+>', 'g'))\n        LOOP\n            SELECT TRIM(BOTH '<>' FROM alias_with_separators) INTO node_alias;\n\n            SELECT nodeid, nodegroupid INTO node_for_alias, nodegroup_for_alias\n                FROM nodes\n                WHERE alias = node_alias\n                AND graphid = graph;\n\n            SELECT tiledata ->> node_for_alias::text INTO localized_string_node_value\n                FROM tiles\n                WHERE resourceinstanceid = resourceid\n                AND nodegroupid = nodegroup_for_alias\n                AND sortorder = 0\n                LIMIT 1;\n\n            -- Handle no value for string node\n\n            IF localized_string_node_value IS NULL THEN\n                -- Update the template (used below if no aliases have been resolved yet)\n                SELECT REPLACE(this_template, alias_with_separators, ' -- ') INTO this_template;\n                -- Update any intermediate values already saved\n                FOR lang, resolved_node_values_by_descriptor IN SELECT * FROM jsonb_each(localized_result_all)\n                LOOP\n                    SELECT REPLACE(\n                        TRIM((resolved_node_values_by_descriptor::jsonb -> descriptor_key)::text, '\\\"'),\n                        alias_with_separators,\n                        ' -- '\n                    ) INTO resolved_node_value_for_lang;\n\n                    IF resolved_node_value_for_lang IS NOT NULL THEN\n                        SELECT jsonb_set(\n                            localized_result_all,\n                            ARRAY[lang, descriptor_key],\n                            TO_JSONB(resolved_node_value_for_lang)\n                        ) INTO localized_result_all;\n                    END IF;\n                END LOOP;\n\n                IF descriptor_key = 'name' THEN\n                    FOR lang, resolved_node_value_for_lang IN SELECT * FROM jsonb_each(localized_result_name_only)\n                    LOOP\n                        SELECT REPLACE(\n                            TRIM(resolved_node_value_for_lang, '\\\"'),\n                            alias_with_separators,\n                            ' -- '\n                        ) INTO resolved_node_value_for_lang;\n\n                        IF resolved_node_value_for_lang IS NOT NULL THEN\n                            SELECT jsonb_set(\n                                localized_result_name_only,\n                                ARRAY[lang],\n                                TO_JSONB(resolved_node_value_for_lang)\n                            ) INTO localized_result_name_only;\n                        END IF;\n                    END LOOP;\n                END IF;\n\n            END IF;\n\n            -- Handle localized string value\n\n            FOR lang, inner18n_obj_for_lang IN SELECT * FROM jsonb_each(localized_string_node_value) \n            LOOP\n                -- Initialize language key if missing\n                IF localized_result_all -> lang IS NULL THEN\n                    SELECT jsonb_set(\n                        localized_result_all,\n                        ARRAY[lang],\n                        JSONB_OBJECT('{}')\n                    ) INTO localized_result_all;\n                END IF;\n\n                -- Retrieve the current working value, or start from the template\n                SELECT\n                CASE\n                    WHEN localized_result_all -> lang -> descriptor_key IS NULL\n                        THEN this_template\n                    ELSE TRIM((localized_result_all -> lang -> descriptor_key)::text, '\\\"')\n                END\n                INTO working_string;\n\n                SELECT REPLACE(\n                    working_string,\n                    alias_with_separators,\n                    TRIM((inner18n_obj_for_lang -> 'value')::text, '\"')\n                )\n                INTO resolved_node_value_for_lang;\n\n                -- Update the working value\n                SELECT jsonb_set(\n                    localized_result_all,\n                    ARRAY[lang, descriptor_key],\n                    TO_JSONB(resolved_node_value_for_lang)\n                ) INTO localized_result_all;\n\n                IF descriptor_key = 'name' THEN\n                    SELECT jsonb_set(\n                        localized_result_name_only,\n                        ARRAY[lang],\n                        TO_JSONB(resolved_node_value_for_lang)\n                    ) INTO localized_result_name_only;\n                END IF;\n\n            END LOOP;\n\n        END LOOP;\n\n        -- Handle a template having no dynamic values.\n        IF alias_with_separators IS NULL THEN\n            -- Get a list of languages from an existing descriptor\n            SELECT name INTO sample_localized_name FROM resource_instances WHERE graphid = graph LIMIT 1;\n\n            FOR lang IN SELECT * FROM JSONB_OBJECT_KEYS(sample_localized_name)\n            LOOP\n                SELECT JSONB_SET(\n                    localized_result_all,\n                    ARRAY[lang, descriptor_key],\n                    TO_JSONB(this_template)\n                ) INTO localized_result_all;\n            END LOOP;\n            IF descriptor_key = 'name' THEN\n                FOR lang IN SELECT * FROM JSONB_OBJECT_KEYS(sample_localized_name)\n                LOOP\n                    SELECT JSONB_SET(\n                        localized_result_name_only,\n                        ARRAY[lang],\n                        TO_JSONB(this_template)\n                    ) INTO localized_result_name_only;\n                END LOOP;\n            END IF;\n        END IF;\n\n    END LOOP;\n\n    UPDATE resource_instances\n    SET descriptors = localized_result_all, name = localized_result_name_only\n    WHERE resourceinstanceid = resourceid;\n\n\nEND IF;\nEND;\nRETURN NULL;\n",
                    hash="2bc90a07fa285aa4dd196e208cc1c1ffa2bb45eb",
                    operation="INSERT OR UPDATE OR DELETE",
                    pgid="pgtrigger_calculate_multicard_primary_descriptor_single_26494",
                    table="tiles",
                    when="AFTER",
                ),
            ),
        ),
    ]
