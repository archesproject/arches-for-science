MULTICARD_PRIMARY_DESCRIPTOR_FUNC = """
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
    node_alias text;
    alias_with_separators text;
    node_for_alias UUID;
    nodegroup_for_alias UUID;
    localized_string_node_value jsonb;
    lang text;
    inner18n_obj_for_lang jsonb;
    resolved_node_value_for_lang text;
    working_string text;
    localized_calculated_result jsonb;

BEGIN

SELECT config, r.graphid
INTO fn_config, graph
FROM functions_x_graphs
INNER JOIN resource_instances AS r ON r.resourceinstanceid = NEW.resourceinstanceid
WHERE
    functionid = '00b2d15a-fda0-4578-b79a-784e4138664b'
    AND config IS NOT NULL;

IF FOUND THEN
    SELECT JSONB_OBJECT('{}') INTO localized_calculated_result;
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
                WHERE resourceinstanceid = NEW.resourceinstanceid
                AND nodegroupid = nodegroup_for_alias
                AND sortorder = 0
                LIMIT 1;
            
            -- Replace template with localized string
            FOR lang, inner18n_obj_for_lang IN SELECT * FROM jsonb_each(localized_string_node_value) 
            LOOP
                -- Initialize language key if missing
                IF localized_calculated_result -> lang IS NULL THEN
                    SELECT jsonb_set(
                        localized_calculated_result,
                        ARRAY[lang],
                        JSONB_OBJECT('{}')
                    ) INTO localized_calculated_result;
                END IF;

                -- Retrieve the current working value, or start from the template
                SELECT
                CASE
                    WHEN localized_calculated_result -> lang -> descriptor_key IS NULL
                        THEN this_template
                    ELSE (localized_calculated_result -> lang -> descriptor_key)::text
                END
                INTO working_string;
    
                SELECT TRIM(
                    REPLACE(
                        working_string,
                        alias_with_separators,
                        (inner18n_obj_for_lang -> 'value')::text
                    )
                , '"')
                INTO resolved_node_value_for_lang;
    
                -- Update the working value
                SELECT jsonb_set(
                    localized_calculated_result,
                    ARRAY[lang, descriptor_key],
                    TO_JSONB(resolved_node_value_for_lang)
                ) INTO localized_calculated_result;
    
                RAISE NOTICE '%s', localized_calculated_result;
    
            END LOOP;

        END LOOP;

    END LOOP;

    UPDATE resource_instances
    SET descriptors = localized_calculated_result
    WHERE resourceinstanceid = NEW.resourceinstanceid;

END IF;
END;
RETURN NULL;
"""
