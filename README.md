# Welcome to Arches for Science!

Please see the [project page](http://archesproject.org/) for more information on the Arches project.

The Arches Installation Guide and Arches User Guide are available [here](http://archesproject.org/documentation/).


## How to setup Arches for Science for your project

## 1. Installation
`Important`: Installing the arches-for-science app will install Arches as a dependency. This may replace your current install of Arches with a version from PyPi. If you've installed Arches for development using the `--editable` flag, you'll need to reinstall Arches after installing arches-for-science

### If installing for development
Clone the arches-for-science repo and checkout the latest `dev/x.x.x` branch. 
Navigate to the `arches-for-science` directory from your terminal and run:
 ```
pip install -e .
 ```

### If installing for deployment, run:
```
pip install arches-for-science
```

## 2. Project Configuration

If you don't already have an Arches project, you'll need to create one by following the instructions in the Arches [documentation](http://archesproject.org/documentation/).
Since Arches for Science uses `Cantaloupe` as its IIIF server, take notice of the
Cantaloupe [installation instructions](https://arches.readthedocs.io/en/stable/developing/advanced/managing-and-hosting-iiif/), too.

When your project is ready add "arches_templating" and "arches_for_science" to INSTALLED_APPS and "arches_for_science" to ARCHES_APPLICATIONS in your project's settings.py file:
```
INSTALLED_APPS = (
    ...
    "arches_templating",
    "arches_for_science",
    "myappname",
)

ARCHES_APPLICATIONS = ('arches_for_science',)
```

Also add the following lines to settings.py. (Note: ``arches-project create``
before Arches 6.2.6 or 7.5.0 did not create ``RENDERERS``, so you may need to
[add it first](https://github.com/archesproject/arches/pull/10171/files)
before extending it as shown below):
```
TEMPLATES[0]["OPTIONS"]["context_processors"].append("arches_for_science.utils.context_processors.project_settings")

RENDERERS += [
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

INSTRUMENT_FILE_FORMATS = ["txt"]

X_FRAME_OPTIONS = "SAMEORIGIN"
```

Next ensure arches and arches_for_science are included as dependencies in package.json
```
"dependencies": {
    "arches": "archesproject/arches#dev/7.5.x",
    "arches_for_science": "archesproject/arches-for-science#dev/1.1.x"
}
```

Update urls.py to include the arches-for-science urls
```
urlpatterns = [
    path("", include("arches.urls")),
    path("", include("arches_for_science.urls")),
    path("reports/", include("arches_templating.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

Install the arches application package (models and other data)
```
python manage.py packages -o load_package -a arches_for_science -dev -y
```

Start your project
```
python manage.py runserver
```

Next cd into your project's app directory (the one with package.json e.g. `$PROJECT_NAME/$PROJECT_NAME/`) install and build front-end dependencies:
```
yarn install
yarn build_development
```
