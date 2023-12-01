CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_BEGIN = """
DECLARE
    fn_config jsonb;
    name_template text;
    map_popup_template text;
    description_template text;
    all_templates text[];
    this_template text;
    loop_index int;
    descriptor_key text;

    graph UUID;
    resourceid UUID;
    node_alias text;
    alias_with_separators text;
    node_for_alias UUID;
    nodegroup_for_alias UUID;
    localized_string_node_value jsonb;
    lang text;
    inner18n_obj_for_lang jsonb;
    resolved_node_value_for_lang text;
    resolved_node_values_by_descriptor text;
    working_string text;
    localized_result_all jsonb;
    localized_result_name_only jsonb;
    sample_localized_name jsonb;

BEGIN
"""

# For tiles trigger
CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_FIRST_BRANCH_SINGLE = """
SELECT NEW.resourceinstanceid INTO resourceid;
SELECT graphid INTO graph FROM resource_instances WHERE resourceinstanceid = resourceid;

SELECT config
INTO fn_config
FROM functions_x_graphs
WHERE
    functionid = '00b2d15a-fda0-4578-b79a-784e4138664b'
    AND functions_x_graphs.config IS NOT NULL
    AND graph = graphid;

IF FOUND THEN
"""

# For functions_x_graphs trigger
CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_FIRST_BRANCH_ALL = """
SELECT NEW.config, NEW.graphid
INTO fn_config, graph;

FOR resourceid IN (SELECT resourceinstanceid FROM resource_instances WHERE graphid = graph)
LOOP
"""

CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_COMMON = r"""
    SELECT JSONB_OBJECT('{}') INTO localized_result_all;
    SELECT JSONB_OBJECT('{}') INTO localized_result_name_only;
    SELECT fn_config -> 'descriptor_types' -> 'name' -> 'string_template' INTO name_template;
    SELECT fn_config -> 'descriptor_types' -> 'map_popup' -> 'string_template' INTO map_popup_template;
    SELECT fn_config -> 'descriptor_types' -> 'description' -> 'string_template' INTO description_template;

    SELECT ARRAY[name_template, map_popup_template, description_template] INTO all_templates;
    SELECT 0 INTO loop_index;
    FOR this_template IN SELECT UNNEST(all_templates)
    LOOP
        SELECT loop_index + 1 INTO loop_index;
        SELECT
        CASE
            WHEN loop_index = 1 THEN 'name'
            WHEN loop_index = 2 THEN 'map_popup'
            ELSE 'description'
        END
        INTO descriptor_key;

        -- Remove outer quotes from template
        SELECT TRIM(this_template, '"') INTO this_template;
        -- Unescape some characters before doing string replacement
        SELECT REPLACE(this_template, '\"', '"') INTO this_template;

        -- Resolve node values to localized strings
        FOR alias_with_separators IN SELECT UNNEST(REGEXP_MATCHES(this_template, '<\w+>', 'g'))
        LOOP
            SELECT TRIM(BOTH '<>' FROM alias_with_separators) INTO node_alias;

            SELECT nodeid, nodegroupid INTO node_for_alias, nodegroup_for_alias
                FROM nodes
                WHERE alias = node_alias
                AND graphid = graph;

            SELECT tiledata ->> node_for_alias::text INTO localized_string_node_value
                FROM tiles
                WHERE resourceinstanceid = resourceid
                AND nodegroupid = nodegroup_for_alias
                AND sortorder = 0
                LIMIT 1;

            -- Handle no value for string node

            IF localized_string_node_value IS NULL THEN
                -- Update the template (used below if no aliases have been resolved yet)
                SELECT REPLACE(this_template, alias_with_separators, ' -- ') INTO this_template;
                -- Update any intermediate values already saved
                FOR lang, resolved_node_values_by_descriptor IN SELECT * FROM jsonb_each(localized_result_all)
                LOOP
                    SELECT REPLACE(
                        TRIM((resolved_node_values_by_descriptor::jsonb -> descriptor_key)::text, '\"'),
                        alias_with_separators,
                        ' -- '
                    ) INTO resolved_node_value_for_lang;

                    IF resolved_node_value_for_lang IS NOT NULL THEN
                        SELECT jsonb_set(
                            localized_result_all,
                            ARRAY[lang, descriptor_key],
                            TO_JSONB(resolved_node_value_for_lang)
                        ) INTO localized_result_all;
                    END IF;
                END LOOP;

                IF descriptor_key = 'name' THEN
                    FOR lang, resolved_node_value_for_lang IN SELECT * FROM jsonb_each(localized_result_name_only)
                    LOOP
                        SELECT REPLACE(
                            TRIM(resolved_node_value_for_lang, '\"'),
                            alias_with_separators,
                            ' -- '
                        ) INTO resolved_node_value_for_lang;

                        IF resolved_node_value_for_lang IS NOT NULL THEN
                            SELECT jsonb_set(
                                localized_result_name_only,
                                ARRAY[lang],
                                TO_JSONB(resolved_node_value_for_lang)
                            ) INTO localized_result_name_only;
                        END IF;
                    END LOOP;
                END IF;

            END IF;

            -- Handle localized string value

            FOR lang, inner18n_obj_for_lang IN SELECT * FROM jsonb_each(localized_string_node_value) 
            LOOP
                -- Initialize language key if missing
                IF localized_result_all -> lang IS NULL THEN
                    SELECT jsonb_set(
                        localized_result_all,
                        ARRAY[lang],
                        JSONB_OBJECT('{}')
                    ) INTO localized_result_all;
                END IF;

                -- Retrieve the current working value, or start from the template
                SELECT
                CASE
                    WHEN localized_result_all -> lang -> descriptor_key IS NULL
                        THEN this_template
                    ELSE TRIM((localized_result_all -> lang -> descriptor_key)::text, '\"')
                END
                INTO working_string;

                SELECT REPLACE(
                    working_string,
                    alias_with_separators,
                    TRIM((inner18n_obj_for_lang -> 'value')::text, '"')
                )
                INTO resolved_node_value_for_lang;

                -- Update the working value
                SELECT jsonb_set(
                    localized_result_all,
                    ARRAY[lang, descriptor_key],
                    TO_JSONB(resolved_node_value_for_lang)
                ) INTO localized_result_all;

                IF descriptor_key = 'name' THEN
                    SELECT jsonb_set(
                        localized_result_name_only,
                        ARRAY[lang],
                        TO_JSONB(resolved_node_value_for_lang)
                    ) INTO localized_result_name_only;
                END IF;

            END LOOP;

        END LOOP;

        -- Handle a template having no dynamic values.
        IF alias_with_separators IS NULL THEN
            -- Get a list of languages from an existing descriptor
            SELECT name INTO sample_localized_name FROM resource_instances WHERE graphid = graph LIMIT 1;

            FOR lang IN SELECT * FROM JSONB_OBJECT_KEYS(sample_localized_name)
            LOOP
                SELECT JSONB_SET(
                    localized_result_all,
                    ARRAY[lang, descriptor_key],
                    TO_JSONB(this_template)
                ) INTO localized_result_all;
            END LOOP;
            IF descriptor_key = 'name' THEN
                FOR lang IN SELECT * FROM JSONB_OBJECT_KEYS(sample_localized_name)
                LOOP
                    SELECT JSONB_SET(
                        localized_result_name_only,
                        ARRAY[lang],
                        TO_JSONB(this_template)
                    ) INTO localized_result_name_only;
                END LOOP;
            END IF;
        END IF;

    END LOOP;

    UPDATE resource_instances
    SET descriptors = localized_result_all, name = localized_result_name_only
    WHERE resourceinstanceid = resourceid;

"""

CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_END = """
END IF;
END;
RETURN NULL;
"""

CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_SINGLE = (
    CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_BEGIN
    + CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_FIRST_BRANCH_SINGLE
    + CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_COMMON
    + CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_END
)


CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_ALL = (
    CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_BEGIN
    + CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_FIRST_BRANCH_ALL
    + CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_COMMON
    + CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_END.replace("IF", "LOOP")
)
