from arches.app.utils.search_thumbnail_fetcher_factory import SearchThumbnailFetcherFactory
from arches.app.utils.search_thumbnail_fetcher import SearchThumbnailFetcher
import requests
from django.utils.translation import get_language


@SearchThumbnailFetcherFactory.register("707cbd78-ca7a-11e9-990b-a4d18cec433a")
class DigitalResourceThumbnailFetcher(SearchThumbnailFetcher):
    def get_thumbnail(self, retrieve):
        DIGITAL_RESOURCE_TYPE_NODEGROUP_ID = "09c1778a-ca7b-11e9-860b-a4d18cec433a"
        IIIF_MANIFEST_TYPE = "305c62f0-7e3d-4d52-a210-b451491e6100"
        MANIFEST_NODEGROUP_ID = "56f8e26e-ca7c-11e9-9aa3-a4d18cec433a"
        MANIFEST_URL_NODE_ID = "56f8e9bd-ca7c-11e9-b578-a4d18cec433a"
        ID_TYPE_NODE_ID = "56f8e759-ca7c-11e9-bda1-a4d18cec433a"
        URL_VALUE_ID = "f32d0944-4229-4792-a33c-aadc2b181dc7"
        self.resource.load_tiles()
        digital_resource_type_tile = next(
            (tile for tile in self.resource.tiles if str(tile.nodegroup_id) == DIGITAL_RESOURCE_TYPE_NODEGROUP_ID), None
        )
        if digital_resource_type_tile and IIIF_MANIFEST_TYPE in digital_resource_type_tile.data[DIGITAL_RESOURCE_TYPE_NODEGROUP_ID]:
            manifest_tile = next(
                (
                    tile
                    for tile in self.resource.tiles
                    if (str(tile.nodegroup_id) == MANIFEST_NODEGROUP_ID and URL_VALUE_ID in tile.data[ID_TYPE_NODE_ID])
                ),
                None,
            )
            manifest_url = manifest_tile.data[MANIFEST_URL_NODE_ID][get_language()]["value"]
            response = requests.get(manifest_url, timeout=1)
            try:
                response_json = response.json()
                if "thumbnail" in response_json:
                    image_url = response_json["thumbnail"]["@id"]
            except ValueError:
                image_url = manifest_url.replace("full/full", "full/!200,200")

            if retrieve:
                response = requests.get(image_url, allow_redirects=True)
                response.raw.decode_content = True
                if response.ok:
                    return (response.content, response.headers["Content-Type"])
            else:
                response = requests.head(image_url, allow_redirects=True)
                if response.ok:
                    return ()
        return None
