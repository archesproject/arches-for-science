from django.db import migrations
import uuid

elements = [
    {"element": "Hydrogen", "symbol": "H", "conceptid": "d16b4b14-4c86-47de-9647-495833687298"},
    {"element": "Helium", "symbol": "He", "conceptid": "10a215ed-a80c-4974-82a0-68766141b434"},
    {"element": "Lithium", "symbol": "Li", "conceptid": "0a14e5d4-2bde-46ad-9eed-e888bab1e53b"},
    {"element": "Beryllium", "symbol": "Be", "conceptid": "ba723d66-715f-49f3-b3d2-40c9f20510f1"},
    {"element": "Boron", "symbol": "B", "conceptid": "45843dac-a726-435b-bc77-f3132c328e63"},
    {"element": "Carbon", "symbol": "C", "conceptid": "c64d26d1-d0b5-4a9a-9286-4942b915925d"},
    {"element": "Nitrogen", "symbol": "N", "conceptid": "798ecc23-2f34-4e13-94b4-b5a0831a2f3a"},
    {"element": "Oxygen", "symbol": "O", "conceptid": "94d5c83b-a55b-4d87-80cd-bfad1c9e717c"},
    {"element": "Fluorine", "symbol": "F", "conceptid": "e8d1a9bd-045a-4c96-9f9a-20944737ee83"},
    {"element": "Neon", "symbol": "Ne", "conceptid": "dad241d2-175c-4319-bcf9-c1ba70bda7e6"},
    {"element": "Sodium", "symbol": "Na", "conceptid": "8b7bd8bb-b228-4d0d-91a8-038f202d9f51"},
    {"element": "Magnesium", "symbol": "Mg", "conceptid": "f6c7105e-fa1d-4da4-9c11-0fc3cb06c8f0"},
    {"element": "Aluminum", "symbol": "Al", "conceptid": "66d75c7b-cafc-4740-87ab-1d9ce3f755ea"},
    {"element": "Silicon", "symbol": "Si", "conceptid": "8c1595e4-6f8e-434c-9f65-e1c3589c3f72"},
    {"element": "Phosphorus", "symbol": "P", "conceptid": "bbaee296-3eb4-44c9-8bc9-ecaadca00e01"},
    {"element": "Sulfur", "symbol": "S", "conceptid": "6da257a3-a82f-48a4-b4f0-7276131b0c4e"},
    {"element": "Chlorine", "symbol": "Cl", "conceptid": "4895c70f-fb12-4412-84d5-86abe742cb30"},
    {"element": "Argon", "symbol": "Ar", "conceptid": "af775082-8a3d-464a-9f03-a8d9b6b26f10"},
    {"element": "Potassium", "symbol": "K", "conceptid": "2ff81125-8e3f-43fc-a92a-75baed7639e3"},
    {"element": "Calcium", "symbol": "Ca", "conceptid": "3b5b53d3-bc3b-4b94-bbce-b435cbb8d210"},
    {"element": "Scandium", "symbol": "Sc", "conceptid": "f8cc9721-cbab-4d76-a588-4a76c220687d"},
    {"element": "Titanium", "symbol": "Ti", "conceptid": "3437adbb-97df-463a-b1c6-65ffaaf28414"},
    {"element": "Vanadium", "symbol": "V", "conceptid": "ff3918b4-ebf5-407b-9d9e-951532a6e55f"},
    {"element": "Chromium", "symbol": "Cr", "conceptid": "6c77fa92-dd5d-4a95-8ce9-55f9a0aead45"},
    {"element": "Manganese", "symbol": "Mn", "conceptid": "5f443efa-08fa-41bf-9bad-b829e8083429"},
    {"element": "Iron", "symbol": "Fe", "conceptid": "0ede5787-434b-4bf2-94d3-ac5ba80465b5"},
    {"element": "Cobalt", "symbol": "Co", "conceptid": "1c5ba628-5ab6-4ee7-946a-a4bdefee0919"},
    {"element": "Nickel", "symbol": "Ni", "conceptid": "e21920ed-72ee-4e63-a9c4-98e0fd2c6811"},
    {"element": "Copper", "symbol": "Cu", "conceptid": "8e08ccab-5aea-4d44-9b89-9e0834aa8390"},
    {"element": "Zinc", "symbol": "Zn", "conceptid": "50cbd32b-14d0-4ac4-ade4-629a3ad8c694"},
    {"element": "Gallium", "symbol": "Ga", "conceptid": "f7cd5a85-2b8d-42ec-9566-57a59af9c8c8"},
    {"element": "Germanium", "symbol": "Ge", "conceptid": "d3760ea8-324f-479c-b8ea-7b1b05fcb7c1"},
    {"element": "Arsenic", "symbol": "As", "conceptid": "339e769f-4259-450c-8572-903858343869"},
    {"element": "Selenium", "symbol": "Se", "conceptid": "b8dced33-c032-4dfc-a72d-1df8bb185760"},
    {"element": "Bromine", "symbol": "Br", "conceptid": "85c8889f-d85f-41e4-8e3c-69644d98bee9"},
    {"element": "Krypton", "symbol": "Kr", "conceptid": "60a15f0c-7dc7-4fbd-817a-4d827ff58c97"},
    {"element": "Rubidium", "symbol": "Rb", "conceptid": "f51d6b90-1bd4-425d-91a9-04c2bb9f0164"},
    {"element": "Strontium", "symbol": "Sr", "conceptid": "58b2a731-e2f9-4925-b950-c4e0a908821d"},
    {"element": "Yttrium", "symbol": "Y", "conceptid": "a36c95d6-92dc-4be6-b277-fca3f18f0c2a"},
    {"element": "Zirconium", "symbol": "Zr", "conceptid": "bc2b7ddc-7e71-479b-b89d-50c00794bae7"},
    {"element": "Niobium", "symbol": "Nb", "conceptid": "fe1fdf56-9669-401e-824c-0ff7368bdcaa"},
    {"element": "Molybdenum", "symbol": "Mo", "conceptid": "8f00a23b-fd48-43e9-8ec2-59a60a7957c6"},
    {"element": "Technetium", "symbol": "Tc", "conceptid": "abf7d596-9e36-4bbe-8b7c-f2b40fd5697b"},
    {"element": "Ruthenium", "symbol": "Ru", "conceptid": "b134d2a0-532a-42d5-b124-5a1710e39d65"},
    {"element": "Rhodium", "symbol": "Rh", "conceptid": "2e51a0c5-67a5-4be3-b2a9-6241b671cc1f"},
    {"element": "Palladium", "symbol": "Pd", "conceptid": "2f29e8ea-4d05-4995-8682-8ef84584a1a5"},
    {"element": "Silver", "symbol": "Ag", "conceptid": "b1f6d85d-9ea2-4156-a3ca-e2a0965c0937"},
    {"element": "Cadmium", "symbol": "Cd", "conceptid": "90d6139d-46e4-46ca-8d92-a339a8092056"},
    {"element": "Indium", "symbol": "In", "conceptid": "2f54357f-8552-406a-b702-3dc31e24b788"},
    {"element": "Tin", "symbol": "Sn", "conceptid": "07352117-9e9a-485e-a042-a3df8c7d1d6a"},
    {"element": "Antimony", "symbol": "Sb", "conceptid": "e6db9f29-4a2f-4393-97d2-0e9435ccff69"},
    {"element": "Tellurium", "symbol": "Te", "conceptid": "d529cea0-16fb-4c03-85e2-eb37bd499fc0"},
    {"element": "Iodine", "symbol": "I", "conceptid": "29ee707a-0b99-4286-bfc1-c0268a72b9ca"},
    {"element": "Xenon", "symbol": "Xe", "conceptid": "b1eb4eb1-a848-45cb-8e8b-dbc6d33b51cb"},
    {"element": "Cesium", "symbol": "Cs", "conceptid": "50525207-905f-4e65-a816-9f024dfc67f7"},
    {"element": "Barium", "symbol": "Ba", "conceptid": "d70d092d-eb98-42fe-a153-a88732e5745b"},
    {"element": "Lanthanum", "symbol": "La", "conceptid": "52454dff-1c2b-4e39-9c1b-0879993cf08f"},
    {"element": "Cerium", "symbol": "Ce", "conceptid": "7ebce11e-ee7e-475a-a36e-2b38f7d1d984"},
    {"element": "Praseodymium", "symbol": "Pr", "conceptid": "78525076-60d1-4e00-8cf1-6ca9f3a3f02e"},
    {"element": "Neodymium", "symbol": "Nd", "conceptid": "6186c844-0f95-4c21-926e-87347b45df8a"},
    {"element": "Promethium", "symbol": "Pm", "conceptid": "3efa527c-32e6-4a2a-84aa-b018ce0742f2"},
    {"element": "Samarium", "symbol": "Sm", "conceptid": "ad04f159-3d1f-4508-b820-870eebbc40e4"},
    {"element": "Europium", "symbol": "Eu", "conceptid": "b404f414-7aef-403b-a04d-300b2df8a884"},
    {"element": "Gadolinium", "symbol": "Gd", "conceptid": "760e3a5a-3401-43d2-90ef-1a2b97182131"},
    {"element": "Terbium", "symbol": "Tb", "conceptid": "911f6feb-7c1c-4d67-a86d-333e70aa77b5"},
    {"element": "Dysprosium", "symbol": "Dy", "conceptid": "a4011080-0aed-4320-a2c9-cd3fe7eb25e9"},
    {"element": "Holmium", "symbol": "Ho", "conceptid": "076cbfad-bfce-4096-894b-04467470fbc8"},
    {"element": "Erbium", "symbol": "Er", "conceptid": "c77f3f92-ee00-4875-a404-50a8a9ea7dc1"},
    {"element": "Thulium", "symbol": "Tm", "conceptid": "12aa5cea-0f98-4b10-8084-24795fe07813"},
    {"element": "Ytterbium", "symbol": "Yb", "conceptid": "cc84ea58-4e46-4c49-a043-eff30f663403"},
    {"element": "Lutetium", "symbol": "Lu", "conceptid": "5cae4306-ddf1-4e43-9e77-95e867c497d3"},
    {"element": "Hafnium", "symbol": "Hf", "conceptid": "581612f5-e396-4859-9d37-39591c91834d"},
    {"element": "Tantalum", "symbol": "Ta", "conceptid": "dd16dc11-132f-4d9a-96ed-9072f322257e"},
    {"element": "Wolfram", "symbol": "W", "conceptid": "4f364fad-a1ab-4956-a36e-204ed8bb2ca0"},
    {"element": "Rhenium", "symbol": "Re", "conceptid": "16cf5efc-6549-42e9-b306-6f30cb430103"},
    {"element": "Osmium", "symbol": "Os", "conceptid": "03099493-552a-44be-8421-ab327fae6874"},
    {"element": "Iridium", "symbol": "Ir", "conceptid": "3fe53655-f35b-45cd-8aea-153181da165c"},
    {"element": "Platinum", "symbol": "Pt", "conceptid": "d5d44b26-05f9-4145-aa3a-0512fb5c4acf"},
    {"element": "Gold", "symbol": "Au", "conceptid": "b500136b-4b36-4db2-85b4-fdb6cce13f51"},
    {"element": "Mercury", "symbol": "Hg", "conceptid": "f04947ea-ae1d-4e63-9245-dfab10303e23"},
    {"element": "Thallium", "symbol": "Tl", "conceptid": "840026ad-a4ee-42ef-850f-6b7d83162961"},
    {"element": "Lead", "symbol": "Pb", "conceptid": "0fdc503e-e2d5-4bff-b351-56d83d79e702"},
    {"element": "Bismuth", "symbol": "Bi", "conceptid": "fd2e3734-ce0c-45ce-9498-f542d482cad4"},
    {"element": "Polonium", "symbol": "Po", "conceptid": "f95fd4f0-31e5-42ff-b8b0-5fe5fea34c65"},
    {"element": "Astatine", "symbol": "At", "conceptid": "bff5f7c9-b4e5-4fd7-8a3b-5b2d77aad099"},
    {"element": "Radon", "symbol": "Rn", "conceptid": "4476323a-0bdc-4931-a22d-1a857c7257a4"},
    {"element": "Francium", "symbol": "Fr", "conceptid": "a00d55b2-147d-4a50-a233-f330120ab4d1"},
    {"element": "Radium", "symbol": "Ra", "conceptid": "f0b690bb-9e27-433b-a614-87e32fc9e87b"},
    {"element": "Actinium", "symbol": "Ac", "conceptid": "2b91123c-3263-48a5-8abf-55a9a6234665"},
    {"element": "Thorium", "symbol": "Th", "conceptid": "1df55246-26a7-4670-aa2b-efde7aff9fa6"},
    {"element": "Protactinium", "symbol": "Pa", "conceptid": "882336f3-a87d-4902-bb36-437f67a529fb"},
    {"element": "Uranium", "symbol": "U", "conceptid": "1441b79e-fed7-4a36-acc5-bb1b60d1976d"},
    {"element": "Neptunium", "symbol": "Np", "conceptid": "fb28c2e9-7a94-4dc2-af72-7d1a076fe176"},
    {"element": "Plutonium", "symbol": "Pu", "conceptid": "ab02482d-e9e0-49ad-aac9-20d51ac99c15"},
    {"element": "Americium", "symbol": "Am", "conceptid": "edd7c6a0-1eb8-4114-b33c-83b125b77caf"},
    {"element": "Curium", "symbol": "Cm", "conceptid": "f162c061-09a7-4338-8564-84e531bad5e5"},
    {"element": "Berkelium", "symbol": "Bk", "conceptid": "aea93315-18f4-4ee5-9a13-549f27e88c1e"},
    {"element": "Californium", "symbol": "Cf", "conceptid": "cf140f56-6a2b-4cfd-9cae-ddc2af1d74a2"},
    {"element": "Einsteinium", "symbol": "Es", "conceptid": "7d34406f-fa99-4613-a4e7-5bf6ff8322c8"},
    {"element": "Fermium", "symbol": "Fm", "conceptid": "d7352ca3-5f0d-4c55-95f5-59eb4a8e65aa"},
    {"element": "Mendelevium", "symbol": "Md", "conceptid": "1d62fff7-c49d-4f8e-9f0d-32a9ff063a90"},
    {"element": "Nobelium", "symbol": "No", "conceptid": "0b6d8038-8207-4a1a-900b-bf0fc55aca79"},
    {"element": "Lawrencium", "symbol": "Lr", "conceptid": "299de067-b416-4778-b01c-a8efbb51d36b"},
    {"element": "Rutherfordium", "symbol": "Rf", "conceptid": "4b4478ab-03e4-40b4-9cdc-e1a5c63f5aa8"},
    {"element": "Dubnium", "symbol": "Db", "conceptid": "12868967-09d9-4ffa-8127-6103936bd27f"},
    {"element": "Seaborgium", "symbol": "Sg", "conceptid": "64fec2d2-89dd-43e8-985d-3b380ad69186"},
    {"element": "Bohrium", "symbol": "Bh", "conceptid": "787614aa-a6b5-467d-8fc8-40aeea66a2d5"},
    {"element": "Hassium", "symbol": "Hs", "conceptid": "fbdb5700-5af7-4bab-babb-94e57bfb7fda"},
    {"element": "Meitnerium", "symbol": "Mt", "conceptid": "96e707d2-c133-4f2b-ab79-311d4345657b"},
    {"element": "Darmstadtium", "symbol": "Ds ", "conceptid": "c939adea-2e59-461e-b3a9-73fd0ac2636f"},
    {"element": "Roentgenium", "symbol": "Rg ", "conceptid": "7f0239ab-5241-44e2-b295-537e51a80c52"},
    {"element": "Copernicium", "symbol": "Cn ", "conceptid": "2480537d-2dee-4ebe-8dad-fec0c8bb04a4"},
    {"element": "Nihonium", "symbol": "Nh", "conceptid": "b32661b5-dba0-4de6-908c-d0104e3b3f94"},
    {"element": "Flerovium", "symbol": "Fl", "conceptid": "fa1e1e2e-0d45-4453-b874-8a459715685d"},
    {"element": "Moscovium", "symbol": "Mc", "conceptid": "98e0163b-7e26-4d1b-9b2e-1c5f289b5ea0"},
    {"element": "Livermorium", "symbol": "Lv", "conceptid": "6bf01a01-4055-417a-b814-5a8051125697"},
    {"element": "Tennessine", "symbol": "Ts", "conceptid": "15d1dcd4-054f-44ab-b64e-75e659513d80"},
    {"element": "Oganesson", "symbol": "Og", "conceptid": "21200099-3708-41ce-b16b-3c81e0a4f8a0"},
]

root_conceptid = "d60f8536-caf4-4a86-abcd-648973d082f2"
root_collectionid = "e4cb1e47-b2d0-49b9-8899-1f1776ad1103"
root_concept_valueid = uuid.UUID("aa2bf57e-4d2a-47a8-8758-154ed2c86371")
root_collection_valueid = uuid.UUID("21b30401-2e57-48cf-a8ef-d7827ee666b3")
root_concept_relationid = uuid.UUID("b221fd98-88cf-4f31-bfd0-49833a0ba5be")
concept_scheme = uuid.UUID("b73e741b-46da-496c-8960-55cc1007bec4")


class Migration(migrations.Migration):

    dependencies = [
        ("arches_for_science", "0007_update_observation_types"),
    ]

    def forward(apps, schema_editor):
        Concept = apps.get_model("models", "Concept")
        Value = apps.get_model("models", "Value")
        ValueType = apps.get_model("models", "DValueType")
        Language = apps.get_model("models", "Language")
        Relation = apps.get_model("models", "Relation")
        RelationType = apps.get_model("models", "DRelationType")

        if Concept.objects.filter(pk=concept_scheme).exists() is False:
            return

        root_concept = Concept(
            conceptid=uuid.UUID(root_conceptid),
            nodetype_id="Concept",
            legacyoid=f"http://localhost:8000/{root_conceptid}",
        )

        root_collection = Concept(
            conceptid=uuid.UUID(root_collectionid),
            nodetype_id="Collection",
            legacyoid=f"http://localhost:8000/{root_collectionid}",
        )

        root_concept.save()
        root_collection.save()
        pref_label_value_type = ValueType.objects.get(valuetype="prefLabel")
        alt_label_value_type = ValueType.objects.get(valuetype="altLabel")
        en = Language.objects.get(code="en")

        Value.objects.update_or_create(
            valueid=root_concept_valueid,
            concept=root_concept,
            valuetype=pref_label_value_type,
            value="Chemical Elements",
            language=en,
        )

        Value.objects.update_or_create(
            valueid=root_collection_valueid,
            concept=root_collection,
            valuetype=pref_label_value_type,
            value="Chemical Elements",
            language=en,
        )

        Relation.objects.update_or_create(
            conceptfrom_id=concept_scheme,
            conceptto=root_concept,
            relationtype=RelationType.objects.get(pk="hasTopConcept"),
            relationid=root_concept_relationid,
        )

        for element in elements:
            element_concept = Concept(
                conceptid=uuid.UUID(element["conceptid"]),
                nodetype_id="Concept",
                legacyoid=f"http://localhost:8000/{element['conceptid']}",
            )
            element_concept.save()

            Value.objects.create(
                valueid=uuid.uuid4(), concept=element_concept, valuetype=pref_label_value_type, value=element["element"], language=en
            )
            Value.objects.create(
                valueid=uuid.uuid4(), concept=element_concept, valuetype=alt_label_value_type, value=element["symbol"], language=en
            )
            Relation.objects.create(
                conceptfrom=root_concept,
                conceptto=element_concept,
                relationtype=RelationType.objects.get(pk="narrower"),
                relationid=uuid.uuid4(),
            )
            Relation.objects.create(
                conceptfrom=root_collection,
                conceptto=element_concept,
                relationtype=RelationType.objects.get(pk="member"),
                relationid=uuid.uuid4(),
            )

    def reverse(apps, schema_editor):
        """
        No need to explicitly delete Value and Relation objects.
        They are deleted in cascade when concepts are deleted.
        """
        Concept = apps.get_model("models", "Concept")
        Concept.objects.get(pk=uuid.UUID(root_conceptid)).delete()
        Concept.objects.get(pk=uuid.UUID(root_collectionid)).delete()

        for element in elements:
            Concept.objects.get(pk=uuid.UUID(element["conceptid"])).delete()

    operations = [migrations.RunPython(forward, reverse)]
