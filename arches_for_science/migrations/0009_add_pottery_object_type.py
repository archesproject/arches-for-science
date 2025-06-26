from django.db import migrations
import uuid

concepts = [
    {
        "values": [
            {
                "type": "prefLabel",
                "value": "ceramic ware (visual works)",
                "language": "en",
                "valueid": "0ace7f2a-e02f-4fae-8203-c6c2f91c015c",
            },
            {"type": "prefLabel", "value": "escultura em cerâmica", "language": "pt", "valueid": "0728d830-a768-4537-8dda-870ad57cc0a5"},
            {
                "type": "scopeNote",
                "value": 'Visual works made of ceramic, especially art works in the form of sculptures, vessels, and other decorative and utilitarian objects made of bone china, porcelain, or stoneware. For the general classification of anything made of ceramic, use "ceramic (object genre)."',
                "language": "en",
                "valueid": "1337436a-ffbc-443c-87cb-640f1af535a4",
            },
            {
                "type": "scopeNote",
                "value": 'Obras visuais feitas de cerâmica, especialmente obras de arte na forma de esculturas, vasos e outros objetos decorativos e utilitários feitos de porcelana, porcelana ou grés. Para a classificação geral de qualquer coisa feita de cerâmica, use "cerâmica (gênero de objeto)".',
                "language": "pt",
                "valueid": "614edf1f-7e23-44e3-ad02-4b93d461a272",
            },
        ],
        "conceptid": "28cd123d-5fdd-4a6f-a915-91683a51fc5f",
        "identifiers": [{"doi": "http://vocab.getty.edu/aat/300386879"}],
        "parentconceptid": "e5909f90-de56-40ed-8262-2b0b9ed629f2",
        "relationid": "955d65a4-de47-4c4f-9150-42d9430f89d4",
        "children": [
            {
                "values": [
                    {
                        "type": "prefLabel",
                        "value": "pottery (visual works)",
                        "language": "en",
                        "valueid": "2b2efd5c-1cf5-46c4-8c2b-a2ac4bc3fd2d",
                    },
                    {
                        "type": "prefLabel",
                        "value": "poteries (œuvres visuelles)",
                        "language": "fr",
                        "valueid": "98d3cfe0-3a9a-4baa-9c8f-eea642a0bc3d",
                    },
                    {"type": "prefLabel", "value": "cerâmica", "language": "pt", "valueid": "4892803b-ff7f-4e82-b4ef-075a29b06f4b"},
                    {
                        "type": "scopeNote",
                        "value": 'Generally, all ware made of ceramic, which is any of various hard, brittle, heat-resistant and corrosion-resistant materials made by shaping and then firing a nonmetallic mineral, such as clay, at a high temperature. In specialized usage, it typically does not include porcelain, which is a type of ceramic ware made of a refractory white clay, or "kaolin," and a feldspathic rock, that react when fired so the clay serves to hold the shape of the object and the rock fuses into a natural glass.',
                        "language": "en",
                        "valueid": "66d0c759-9e1e-4be9-b48c-a54375995f54",
                    },
                    {
                        "type": "scopeNote",
                        "value": 'Geralmente, todos os utensílios de cerâmica, que são vários materiais duros, quebradiços, resistentes ao calor e à corrosão, feitos moldando e depois queimando um mineral não metálico, como argila, a alta temperatura. Em uso especializado, normalmente não inclui porcelana, que é um tipo de louça de cerâmica feita de argila branca refratária, ou "caulino", e uma rocha feldspática, que reage quando queimada, de modo que a argila serve para manter a forma do objeto e a rocha se funde em um copo natural.',
                        "language": "pt",
                        "valueid": "ca03e7d6-9827-40f8-a6ea-2da708f27277",
                    },
                ],
                "conceptid": "b7465fec-27aa-48fd-a428-4927a397c0e5",
                "identifiers": [{"doi": "http://vocab.getty.edu/aat/300010666"}],
                "children": [],
                "relationid": "2a0a1248-89c6-4f6a-8a6e-4c8d377fe832",
            }
        ],
    }
]

collection_items = [
    {
        "relationid": "db7f3277-87dc-444f-a25c-565db77d5a64",
        "conceptidfrom": "56991802-f539-4b22-b5a9-b1945fceb52b",
        "conceptidto": "b7465fec-27aa-48fd-a428-4927a397c0e5",
        "relationshiptype": "member",
    }
]

root_conceptid = "e5909f90-de56-40ed-8262-2b0b9ed629f2"


class Migration(migrations.Migration):

    dependencies = [
        ("arches_for_science", "0008_add_chemical_elements"),
    ]

    def forward(apps, schema_editor):
        Concept = apps.get_model("models", "Concept")
        Value = apps.get_model("models", "Value")
        ValueType = apps.get_model("models", "DValueType")
        Language = apps.get_model("models", "Language")
        Relation = apps.get_model("models", "Relation")
        RelationType = apps.get_model("models", "DRelationType")

        if Concept.objects.filter(pk=root_conceptid).exists() is False:
            return

        root_concept = Concept.objects.get(pk=uuid.UUID(root_conceptid))

        value_types = {
            "scopeNote": ValueType.objects.get(valuetype="scopeNote"),
            "prefLabel": ValueType.objects.get(valuetype="prefLabel"),
            "altLabel": ValueType.objects.get(valuetype="altLabel"),
        }

        languages = {"en": Language.objects.get(code="en"), "pt": Language.objects.get(code="pt"), "fr": Language.objects.get(code="fr")}

        relation_types = {"narrower": RelationType.objects.get(pk="narrower"), "member": RelationType.objects.get(pk="member")}

        def build_concepts(parent=None, concepts=[]):
            for concept in concepts:
                concept_instance = Concept(
                    conceptid=uuid.UUID(concept["conceptid"]),
                    nodetype_id="Concept",
                    legacyoid=concept["identifiers"][0]["doi"],
                )
                concept_instance.save()
                Relation.objects.create(
                    conceptfrom=parent,
                    conceptto=concept_instance,
                    relationtype=relation_types["narrower"],
                    relationid=concept["relationid"],
                )

                for value in concept["values"]:
                    Value.objects.update_or_create(
                        valueid=value["valueid"],
                        concept=concept_instance,
                        valuetype=value_types[value["type"]],
                        value=value["value"],
                        language=languages[value["language"]],
                    )
            if len(concept["children"]):
                build_concepts(concept_instance, concept["children"])

        def add_collection_items(collection_items=[]):
            for concept in collection_items:
                Relation.objects.update_or_create(
                    conceptfrom_id=concept["conceptidfrom"],
                    conceptto_id=concept["conceptidto"],
                    relationtype=relation_types["member"],
                    relationid=concept["relationid"],
                )

        build_concepts(parent=root_concept, concepts=concepts)
        add_collection_items(collection_items=collection_items)

    def reverse(apps, schema_editor):
        """
        No need to explicitly delete Value and Relation objects.
        They are deleted in cascade when concepts are deleted.
        """
        Concept = apps.get_model("models", "Concept")

        for concept in concepts:
            Concept.objects.get(pk=uuid.UUID(concept["conceptid"])).delete()
            for child in concept["children"]:
                Concept.objects.get(pk=uuid.UUID(child["conceptid"])).delete()

    operations = [migrations.RunPython(forward, reverse)]
