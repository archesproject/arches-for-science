from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("arches_for_science", "0005_deploy_triggers_for_primary_descriptor"),
    ]

    remove_top_concept = """
        update relations set conceptidfrom = 'b73e741b-46da-496c-8960-55cc1007bec4', relationtype = 'hasTopConcept' where conceptidfrom = '102efe26-d6b5-4524-a1bc-93b1792b6970';
        delete from values where conceptid = '102efe26-d6b5-4524-a1bc-93b1792b6970';
        delete from relations where conceptidto = '102efe26-d6b5-4524-a1bc-93b1792b6970';
        delete from concepts where conceptid = '102efe26-d6b5-4524-a1bc-93b1792b6970';
        """

    restore_top_concept = """
        insert into concepts (conceptid, legacyoid, nodetype) values ('102efe26-d6b5-4524-a1bc-93b1792b6970', 'http://localhost:8000/102efe26-d6b5-4524-a1bc-93b1792b6970', 'Concept');
        insert into values (valueid, value, conceptid, languageid, valuetype) values ('43a86d96-4b08-48f0-ac23-ccad248fdaec','TopConcept', '102efe26-d6b5-4524-a1bc-93b1792b6970', 'en-US', 'prefLabel');
        insert into values (valueid, value, conceptid, languageid, valuetype) values ('542946b6-b609-4145-afa0-449ec3a6ec0a','http://localhost:8000/102efe26-d6b5-4524-a1bc-93b1792b6970', '102efe26-d6b5-4524-a1bc-93b1792b6970', 'en', 'identifier');
        update relations set conceptidfrom = '102efe26-d6b5-4524-a1bc-93b1792b6970', relationtype = 'narrower' where conceptidfrom = 'b73e741b-46da-496c-8960-55cc1007bec4';
        insert into relations (relationid, conceptidfrom, conceptidto, relationtype) values ('cad00dfe-991e-4d5a-80b1-9dc359fdf528','b73e741b-46da-496c-8960-55cc1007bec4','102efe26-d6b5-4524-a1bc-93b1792b6970', 'hasTopConcept');
    """

    operations = [
        migrations.RunSQL(
            remove_top_concept,
            restore_top_concept,
        )
    ]
