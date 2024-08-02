from django.db import migrations
from django.db import connection


class Migration(migrations.Migration):

    dependencies = [
        ("arches_for_science", "0006_remove_TopConcept"),
    ]

    def forward(apps, schema_editor):
        sql = """
            -- Add 2D Data Measurement
            insert into concepts (conceptid, legacyoid, nodetype) values ('c6ad85c9-12a5-40f5-8773-9b513ded7585', 'https://afs.test.fargeo.com/c6ad85c9-12a5-40f5-8773-9b513ded7585', 'Concept');
            insert into values (valueid, value, conceptid, languageid, valuetype) values ('1b23b170-114c-4602-b01a-4d0f8aba05ec', '2D Data Measurement', 'c6ad85c9-12a5-40f5-8773-9b513ded7585', 'en', 'prefLabel');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('4157e908-660c-45cc-a20f-06a3841b1543', 'c6ad85c9-12a5-40f5-8773-9b513ded7585','narrower');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('0ca18480-f5f2-41b2-b177-857726e5ecd7', 'c6ad85c9-12a5-40f5-8773-9b513ded7585', 'member');
            -- Add 3D Data Measurement
            insert into concepts (conceptid, legacyoid, nodetype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', 'https://afs.test.fargeo.com/9f336e9a-17bd-45bc-a4a2-f816a551d196', 'Concept');
            insert into values (valueid, value, conceptid, languageid, valuetype) values ('a1637323-dd13-41bb-98f1-80f963c6e0ea', '3D Data Measurement', '9f336e9a-17bd-45bc-a4a2-f816a551d196', 'en', 'prefLabel');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('4157e908-660c-45cc-a20f-06a3841b1543', '9f336e9a-17bd-45bc-a4a2-f816a551d196','narrower');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('0ca18480-f5f2-41b2-b177-857726e5ecd7', '9f336e9a-17bd-45bc-a4a2-f816a551d196', 'member');
            -- Move FORS, RAMAN, XRF to 2d
            update relations set conceptidfrom = 'c6ad85c9-12a5-40f5-8773-9b513ded7585' where conceptidfrom = '4157e908-660c-45cc-a20f-06a3841b1543' and conceptidto in (
                '977c662f-c1d9-4a35-b556-696517e312ec',
                'b0f10e3b-6dc6-41a1-b3ac-204ba3f9b982',
                '2e3e64b3-c802-4bbc-b284-5dbcd50ee4da'
            );
            update relations set conceptidfrom = 'c6ad85c9-12a5-40f5-8773-9b513ded7585' where conceptidfrom = '0ca18480-f5f2-41b2-b177-857726e5ecd7' and conceptidto in (
                '977c662f-c1d9-4a35-b556-696517e312ec',
                'b0f10e3b-6dc6-41a1-b3ac-204ba3f9b982',
                '2e3e64b3-c802-4bbc-b284-5dbcd50ee4da'
            ) and relationtype = 'member';

            update values set value = 'Point XRF Measurement' where conceptid = '977c662f-c1d9-4a35-b556-696517e312ec'; 
            insert into values (value, conceptid, languageid, valuetype) values ('Point X-ray fluorescence spectroscopy (XRF) Measurement', '977c662f-c1d9-4a35-b556-696517e312ec', 'en', 'altLabel');

            update values set value = 'Point Raman Measurement' where conceptid = 'b0f10e3b-6dc6-41a1-b3ac-204ba3f9b982';
            insert into values (value, conceptid, languageid, valuetype) values ('Point Raman spectroscopy Measurement', 'b0f10e3b-6dc6-41a1-b3ac-204ba3f9b982', 'en', 'altLabel');

            update values set value = 'FORS Measurement' where conceptid = '2e3e64b3-c802-4bbc-b284-5dbcd50ee4da';
            insert into values (value, conceptid, languageid, valuetype) values ('Fiber Optics Reflectance spectroscopy (FORS) Measurement', '2e3e64b3-c802-4bbc-b284-5dbcd50ee4da', 'en', 'altLabel');


            -- add new concepts
            --FTIR Measurement (Alt label*: Fourier-transform infrared (FTIR) spectroscopy Measurement) 9ef07691-f751-415a-805e-6fc52fbdb5a1
            insert into concepts (conceptid, legacyoid, nodetype) values ('9ef07691-f751-415a-805e-6fc52fbdb5a1', 'https://afs.test.fargeo.com/9ef07691-f751-415a-805e-6fc52fbdb5a1', 'Concept');
            insert into values (valueid, value, conceptid, languageid, valuetype) values ('851414d5-4a7f-4e70-a4fb-6d37e6657798', 'FTIR Measurement', '9ef07691-f751-415a-805e-6fc52fbdb5a1', 'en', 'prefLabel');
            insert into values (value, conceptid, languageid, valuetype) values ('Fourier-transform infrared (FTIR) spectroscopy Measurement', '9ef07691-f751-415a-805e-6fc52fbdb5a1', 'en', 'altLabel');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('c6ad85c9-12a5-40f5-8773-9b513ded7585', '9ef07691-f751-415a-805e-6fc52fbdb5a1', 'narrower');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('c6ad85c9-12a5-40f5-8773-9b513ded7585', '9ef07691-f751-415a-805e-6fc52fbdb5a1', 'member');

            --3D XRF Measurement (Alt label*: 3D X-ray fluorescence (XRF) spectroscopy Measurement) 091a244e-6532-4fc7-8b70-63364c4a4569
            insert into concepts (conceptid, legacyoid, nodetype) values ('091a244e-6532-4fc7-8b70-63364c4a4569', 'https://afs.test.fargeo.com/091a244e-6532-4fc7-8b70-63364c4a4569', 'Concept');
            insert into values (valueid, value, conceptid, languageid, valuetype) values ('17de9b07-66e5-4c97-a968-224fd31506e7', '3D XRF Measurement', '091a244e-6532-4fc7-8b70-63364c4a4569', 'en', 'prefLabel');
            insert into values (value, conceptid, languageid, valuetype) values ('3D X-ray fluorescence (XRF) spectroscopy Measurement', '091a244e-6532-4fc7-8b70-63364c4a4569', 'en', 'altLabel');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', '091a244e-6532-4fc7-8b70-63364c4a4569', 'narrower');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', '091a244e-6532-4fc7-8b70-63364c4a4569', 'member');

            --RIS Measurement (Alt label*: Reflectance imaging spectroscopy (RIS) Measurement) d5c7a90b-fd87-4d2c-86f8-01909795e73e
            insert into concepts (conceptid, legacyoid, nodetype) values ('d5c7a90b-fd87-4d2c-86f8-01909795e73e', 'https://afs.test.fargeo.com/d5c7a90b-fd87-4d2c-86f8-01909795e73e', 'Concept');
            insert into values (valueid, value, conceptid, languageid, valuetype) values ('3e40bee5-736b-42b6-a51b-c7a5cc143b80', 'RIS Measurement', 'd5c7a90b-fd87-4d2c-86f8-01909795e73e', 'en', 'prefLabel');
            insert into values (value, conceptid, languageid, valuetype) values ('Reflectance imaging spectroscopy (RIS) Measurement', 'd5c7a90b-fd87-4d2c-86f8-01909795e73e', 'en', 'altLabel');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', 'd5c7a90b-fd87-4d2c-86f8-01909795e73e', 'narrower');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', 'd5c7a90b-fd87-4d2c-86f8-01909795e73e', 'member');

            --SEM-EDS Measurement (Alt label*: Scanning electron microscopy – energy dispersive (SEM-EDS) spectroscopy Measurement) 9b1c5d1b-7ff9-400a-acde-c9a081eff7e1
            insert into concepts (conceptid, legacyoid, nodetype) values ('9b1c5d1b-7ff9-400a-acde-c9a081eff7e1', 'https://afs.test.fargeo.com/9b1c5d1b-7ff9-400a-acde-c9a081eff7e1', 'Concept');
            insert into values (valueid, value, conceptid, languageid, valuetype) values ('a1f180e3-96a7-46b8-beb5-beedfe94be86', 'SEM-EDS Measurement', '9b1c5d1b-7ff9-400a-acde-c9a081eff7e1', 'en', 'prefLabel');
            insert into values (value, conceptid, languageid, valuetype) values ('Scanning electron microscopy – energy dispersive (SEM-EDS) spectroscopy Measurement', '9b1c5d1b-7ff9-400a-acde-c9a081eff7e1', 'en', 'altLabel');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', '9b1c5d1b-7ff9-400a-acde-c9a081eff7e1', 'narrower');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', '9b1c5d1b-7ff9-400a-acde-c9a081eff7e1', 'member');

            -- 3D Raman Measurement (Alt label*: 3D Raman spectroscopy Measurement) fa1d6a48-4e82-4d23-8747-c4fa10f3301a
            insert into concepts (conceptid, legacyoid, nodetype) values ('fa1d6a48-4e82-4d23-8747-c4fa10f3301a', 'https://afs.test.fargeo.com/fa1d6a48-4e82-4d23-8747-c4fa10f3301a', 'Concept');
            insert into values (valueid, value, conceptid, languageid, valuetype) values ('fb0bb706-b082-4387-85cf-5ca59b3259bc', '3D Raman Measurement', 'fa1d6a48-4e82-4d23-8747-c4fa10f3301a', 'en', 'prefLabel');
            insert into values (value, conceptid, languageid, valuetype) values ('3D Raman spectroscopy Measurement', 'fa1d6a48-4e82-4d23-8747-c4fa10f3301a', 'en', 'altLabel');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', 'fa1d6a48-4e82-4d23-8747-c4fa10f3301a', 'narrower');
            insert into relations (conceptidfrom, conceptidto, relationtype) values ('9f336e9a-17bd-45bc-a4a2-f816a551d196', 'fa1d6a48-4e82-4d23-8747-c4fa10f3301a', 'member');
        """

        with connection.cursor() as cursor:
            cursor.execute("""SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'concepts');""")
            row = cursor.fetchone()
            if len(row) and row[0]:
                cursor.execute("""select * from concepts where conceptid = '4157e908-660c-45cc-a20f-06a3841b1543';""")
                row = cursor.fetchone()
                if row:
                    cursor.execute(sql)

    def reverse(apps, schema_editor):
        sql = """
            update values set value = 'XRF measurement' where conceptid = '977c662f-c1d9-4a35-b556-696517e312ec'; 
            update values set value = 'Raman measurement' where conceptid = 'b0f10e3b-6dc6-41a1-b3ac-204ba3f9b982';
            update values set value = 'FORS measurement' where conceptid = '2e3e64b3-c802-4bbc-b284-5dbcd50ee4da';
            update relations set conceptidfrom = '4157e908-660c-45cc-a20f-06a3841b1543' where conceptidfrom = 'c6ad85c9-12a5-40f5-8773-9b513ded7585' and conceptidto in (
                '977c662f-c1d9-4a35-b556-696517e312ec',
                'b0f10e3b-6dc6-41a1-b3ac-204ba3f9b982',
                '2e3e64b3-c802-4bbc-b284-5dbcd50ee4da'
            ) and relationtype = 'narrower';
            update relations set conceptidfrom = '0ca18480-f5f2-41b2-b177-857726e5ecd7' where conceptidfrom = 'c6ad85c9-12a5-40f5-8773-9b513ded7585' and conceptidto in (
                '977c662f-c1d9-4a35-b556-696517e312ec',
                'b0f10e3b-6dc6-41a1-b3ac-204ba3f9b982',
                '2e3e64b3-c802-4bbc-b284-5dbcd50ee4da'
            ) and relationtype = 'member';
            delete from values where conceptid = 'c6ad85c9-12a5-40f5-8773-9b513ded7585';
            delete from values where conceptid = '9f336e9a-17bd-45bc-a4a2-f816a551d196';
            delete from relations where conceptidto = 'c6ad85c9-12a5-40f5-8773-9b513ded7585' and conceptidfrom = '4157e908-660c-45cc-a20f-06a3841b1543'; -- delete 2d relation to obs
            delete from relations where conceptidto = '9f336e9a-17bd-45bc-a4a2-f816a551d196' and conceptidfrom = '4157e908-660c-45cc-a20f-06a3841b1543'; -- delete 3d relation to obs
            delete from values where valueid = '1b23b170-114c-4602-b01a-4d0f8aba05ec'; -- delete 2d data meas value
            delete from values where valueid = 'a1637323-dd13-41bb-98f1-80f963c6e0ea'; -- delete 3d data meas value
            delete from concepts where conceptid = 'c6ad85c9-12a5-40f5-8773-9b513ded7585'; -- delete 2d data meas concet
            delete from concepts where conceptid = '9f336e9a-17bd-45bc-a4a2-f816a551d196'; -- delete 3d data meas concept

            -- FTIR Measurement (Alt label*: Fourier-transform infrared (FTIR) spectroscopy Measurement) 9ef07691-f751-415a-805e-6fc52fbdb5a1
            delete from relations where conceptidto = '9ef07691-f751-415a-805e-6fc52fbdb5a1';
            delete from values where conceptid = '9ef07691-f751-415a-805e-6fc52fbdb5a1';
            delete from concepts where conceptid = '9ef07691-f751-415a-805e-6fc52fbdb5a1';

            --3D XRF Measurement (Alt label*: 3D X-ray fluorescence (XRF) spectroscopy Measurement) 091a244e-6532-4fc7-8b70-63364c4a4569
            delete from relations where conceptidto = '091a244e-6532-4fc7-8b70-63364c4a4569';
            delete from values where conceptid = '091a244e-6532-4fc7-8b70-63364c4a4569';
            delete from concepts where conceptid = '091a244e-6532-4fc7-8b70-63364c4a4569';

            --RIS Measurement (Alt label*: Reflectance imaging spectroscopy (RIS) Measurement) d5c7a90b-fd87-4d2c-86f8-01909795e73e
            delete from relations where conceptidto = 'd5c7a90b-fd87-4d2c-86f8-01909795e73e';
            delete from values where conceptid = 'd5c7a90b-fd87-4d2c-86f8-01909795e73e';
            delete from concepts where conceptid = 'd5c7a90b-fd87-4d2c-86f8-01909795e73e';

            --SEM-EDS Measurement (Alt label*: Scanning electron microscopy – energy dispersive (SEM-EDS) spectroscopy Measurement) 9b1c5d1b-7ff9-400a-acde-c9a081eff7e1
            delete from relations where conceptidto = '9b1c5d1b-7ff9-400a-acde-c9a081eff7e1';
            delete from values where conceptid = '9b1c5d1b-7ff9-400a-acde-c9a081eff7e1';
            delete from concepts where conceptid = '9b1c5d1b-7ff9-400a-acde-c9a081eff7e1';

            -- 3D Raman Measurement (Alt label*: 3D Raman spectroscopy Measurement) fa1d6a48-4e82-4d23-8747-c4fa10f3301a
            delete from relations where conceptidto = 'fa1d6a48-4e82-4d23-8747-c4fa10f3301a';
            delete from values where conceptid = 'fa1d6a48-4e82-4d23-8747-c4fa10f3301a';
            delete from concepts where conceptid = 'fa1d6a48-4e82-4d23-8747-c4fa10f3301a';

            -- reverse collection changes
            delete from relations where conceptidto = 'c6ad85c9-12a5-40f5-8773-9b513ded7585' and conceptidfrom = '0ca18480-f5f2-41b2-b177-857726e5ecd7'; -- delete 2d relation to obs member
            delete from relations where conceptidto = '9f336e9a-17bd-45bc-a4a2-f816a551d196' and conceptidfrom = '0ca18480-f5f2-41b2-b177-857726e5ecd7'; -- delete 3d relation to obs member


            delete from values where conceptid in (
                '977c662f-c1d9-4a35-b556-696517e312ec',
                'b0f10e3b-6dc6-41a1-b3ac-204ba3f9b982',
                '2e3e64b3-c802-4bbc-b284-5dbcd50ee4da'
            ) and valuetype = 'altLabel';
        """

        with connection.cursor() as cursor:
            cursor.execute(sql)

    operations = [migrations.RunPython(forward, reverse)]
