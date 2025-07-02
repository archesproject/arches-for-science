from arches.app.utils.search_thumbnail_fetcher_factory import SearchThumbnailFetcherFactory
from arches.app.utils.search_thumbnail_fetcher import SearchThumbnailFetcher


@SearchThumbnailFetcherFactory.register("9519cb4f-b25b-11e9-8c7b-a4d18cec433a")
class PhysicalThingThumbnailFetcher(SearchThumbnailFetcher):
    def get_thumbnail(self, retrieve):
        PRIMARY_MANIFEST_NODEGROUP_ID = "8a4ad932-8d59-11eb-a9c4-faffc265b501"
        DIGITAL_RESOURCE_RELATIONSHIP_NODE_ID = "a298ee52-8d59-11eb-a9c4-faffc265b501"
        DIGITAL_REFERENCE_TYPE_NODEID = "f11e4d60-8d59-11eb-a9c4-faffc265b501"
        PREFERRED_MANIFEST_VALUEID = "1497d15a-1c3b-4ee9-a259-846bbab012ed"
        IIIF_MANIFEST_VALUEID = "305c62f0-7e3d-4d52-a210-b451491e6100"

        self.resource.load_tiles()
        manifest_tile = next(
            (
                tile
                for tile in self.resource.tiles
                if str(tile.nodegroup_id) == PRIMARY_MANIFEST_NODEGROUP_ID
                and (tile.data[DIGITAL_REFERENCE_TYPE_NODEID] in (PREFERRED_MANIFEST_VALUEID, IIIF_MANIFEST_VALUEID))
            ),
            None,
        )
        if manifest_tile:
            digital_resource_id = manifest_tile.data[DIGITAL_RESOURCE_RELATIONSHIP_NODE_ID][0]["resourceId"]
            factory = SearchThumbnailFetcherFactory()
            fetcher = factory.create_thumbnail_fetcher(digital_resource_id)
            return fetcher.get_thumbnail(retrieve)
        else:
            return None
