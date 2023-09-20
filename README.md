# Welcome to Arches for Science!

Please see the [project page](http://archesproject.org/) for more information on the Arches project.

The Arches Installation Guide and Arches User Guide are available [here](http://archesproject.org/documentation/).

#### Installation Notes

Ensure your project's `settings.py` contains the following:

```
RENDERERS += [
    {
        "name": "fors-reader",
        "title": "ASD Hi Res FieldSpec4",
        "description": "Use for exports from all our ASD High Resolution Field Spectroscopy",
        "id": "88dccb59-14e3-4445-8f1b-07f0470b38bb",
        "iconclass": "fa fa-bar-chart-o",
        "component": "views/components/cards/file-renderers/fors-reader",
        "ext": "txt",
        "type": "text/plain",
        "exclude": "",
    },
    {
        "name": "xrf-reader",
        "title": "HP Spectrometer XRF ASCII Output",
        "description": "Use for exports from all our HP XRF outputs",
        "id": "31be40ae-dbe6-4f41-9c13-1964d7d17042",
        "iconclass": "fa fa-bar-chart-o",
        "component": "views/components/cards/file-renderers/xrf-reader",
        "ext": "txt",
        "type": "text/plain",
        "exclude": "",
    },
    {
        "name": "raman-reader",
        "title": "Raman File Reader",
        "description": "Use for exports from all our HP raman and gas chromatograph spectrometers",
        "id": "94fa1720-6773-4f99-b49b-4ea0926b3933",
        "iconclass": "fa fa-bolt",
        "component": "views/components/cards/file-renderers/raman-reader",
        "ext": "txt",
        "type": "text/plain",   
        "exclude": "",
    },
    {
        "name": "pdbreader",
        "title": "PDB File Reader",
        "description": "",
        "id": "3744d5ec-c3f1-45a1-ab79-a4a141ee4197",
        "iconclass": "fa fa-object-ungroup",
        "component": "views/components/cards/file-renderers/pdbreader",
        "ext": "pdb",
        "type": "",
        "exclude": "",
    },
    {
        "name": "pcdreader",
        "title": "Point Cloud Reader",
        "description": "",
        "id": "e96e84f2-bcb2-4ca4-8793-7568b09d7374",
        "iconclass": "fa fa-cloud",
        "component": "views/components/cards/file-renderers/pcdreader",
        "ext": "pcd",
        "type": "",
        "exclude": "",
    },
    {
        "name": "xy-reader",
        "title": "XY Data File Reader",
        "description": "Use for all instrument outputs with x-y data",
        "id": "e93b7b27-40d8-4141-996e-e59ff08742f3",
        "iconclass": "fa fa-bolt",
        "component": "views/components/cards/file-renderers/xy-reader",
        "ext": "txt",
        "type": "text/plain",   
        "exclude": "",
    },
]

X_FRAME_OPTIONS = "SAMEORIGIN"

FORMATS = [
    {"name": "Bruker M6 (point)", "id": "bm6", "renderer": "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
    {"name": "Bruker 5g", "id": "b5g", "renderer": "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
    {"name": "Bruker Tracer IV-V", "id": "bt45", "renderer": "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
    {"name": "Bruker Tracer III", "id": "bt3", "renderer": "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
    {"name": "Bruker 5i", "id": "b5i", "renderer": "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
    {"name": "Bruker Artax", "id": "bart", "renderer": "31be40ae-dbe6-4f41-9c13-1964d7d17042"},
    {"name": "Renishaw InVia - 785", "id": "r785", "renderer": "94fa1720-6773-4f99-b49b-4ea0926b3933"},
    {"name": "Ranishsaw inVia - 633/514", "id": "r633", "renderer": "94fa1720-6773-4f99-b49b-4ea0926b3933"},
    {"name": "ASD FieldSpec IV hi res", "id": "asd", "renderer": "88dccb59-14e3-4445-8f1b-07f0470b38bb"},
]

```