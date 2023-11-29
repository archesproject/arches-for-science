CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_SINGLE = r"""
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
    working_string text;
    localized_result_all jsonb;
    localized_result_name_only jsonb;

BEGIN

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

            -- Replace template with localized string
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

    END LOOP;

    UPDATE resource_instances
    SET descriptors = localized_result_all, name = localized_result_name_only
    WHERE resourceinstanceid = resourceid;

END IF;
END;
RETURN NULL;
"""

#### Make two adjustments to create a very similar function that works on ALL resource instances.

# REPLACEMENT 1:
# Just get the config and graph from the edited resource_x_graph record.
# (This trigger only acts on the wanted function.)
# Then iterate all resource for that graph.
target_block_1 = """
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
assert target_block_1 in CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_SINGLE

replacement_block_1 = """
SELECT NEW.config, NEW.graphid
INTO fn_config, graph;

FOR resourceid IN (SELECT resourceinstanceid FROM resource_instances WHERE graphid = graph)
LOOP
"""

# REPLACEMENT 2: Adjust syntax at end.
target_block_2 = """
END IF;
END;
"""
assert target_block_2 in CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_SINGLE

replacement_block_2 = """
END LOOP;
END;
"""

CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_ALL = (
    CALCULATE_MULTICARD_PRIMARY_DESCRIPTOR_SINGLE.replace(
        target_block_1,
        replacement_block_1
    ).replace(
        target_block_2,
        replacement_block_2
    )
)
