# Welcome to Arches for Science!

Arches for Science an Arches Application designed to help conservation scientists record, manage, and visualize laboratory data. 


Please see the [project page](http://archesproject.org/) for more information on the Arches project.


## Installation

If you are installing Arches for Science for the first time, you can install it as an Arches application into a project or run it directly as an Arches project. Running Arches for Science as a project can provide some convienience if you are a developer contributing to the Arches for Science project. Otherwise, **we strongly recommend running Arches for Science as an Arches Application** within a project because that will allow greater flexibility in customizing your project without the risk of conflicts when upgrading to the next version of Arches for Science.  


### If installing for development
Clone the arches-for-science repo and checkout the latest `dev/x.x.x` branch. 
Navigate to the `arches-for-science` directory from your terminal and run:
```
pip install -e .
```
`Important`: Installing the arches-for-science app will install Arches as a dependency. This may replace your current install of Arches with a version from PyPi. If you've installed Arches for development using the `--editable -e` flag, you'll need to re pip install arches after installing arches-for-science

### If installing for deployment, run:
```
pip install arches-for-science
```


## Project Configuration

1. If you don't already have an Arches project, you'll need to create one by following the instructions in the Arches [documentation](http://archesproject.org/documentation/).
Since Arches for Science uses `Cantaloupe` as its IIIF server, take notice of the
Cantaloupe [installation instructions](https://arches.readthedocs.io/en/stable/developing/advanced/managing-and-hosting-iiif/), too.

2. When your project is ready, add "arches_templating", "arches_for_science", and "pgtrigger" to INSTALLED_APPS **below** the name of your project:
    ```
    INSTALLED_APPS = (
        ...
        "my_project_name",
        "arches_templating",
        "arches_for_science",
        "pgtrigger",
    )
    ```

3. Make sure the following settings are added to your project
    ```
    FUNCTION_LOCATIONS.append("arches_for_science.functions")

    TEMPLATES = build_templates_config(
        debug=DEBUG,
        app_root=APP_ROOT,
        context_processors=[
            "django.contrib.auth.context_processors.auth",
            "django.template.context_processors.debug",
            "django.template.context_processors.i18n",
            "django.template.context_processors.media",
            "django.template.context_processors.static",
            "django.template.context_processors.tz",
            "django.template.context_processors.request",
            "django.contrib.messages.context_processors.messages",
            "arches.app.utils.context_processors.livereload",
            "arches.app.utils.context_processors.map_info",
            "arches.app.utils.context_processors.app_settings",
            "arches_for_science.utils.context_processors.project_settings",
        ],
    )

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

    XY_TEXT_FILE_FORMATS = ["txt"]

    X_FRAME_OPTIONS = "SAMEORIGIN"
    ```

4. Next ensure arches and arches_for_science are included as dependencies in package.json
    ```
    "dependencies": {
        "@uppy/aws-s3": "3.6.2",
        "@uppy/core": "3.13.0",
        "@uppy/dashboard": "3.9.0",
        "@uppy/drag-drop": "3.1.0",
        "@uppy/progress-bar": "3.1.1",
        "@uppy/companion-client": "3.1.3",
        "typescript": "5.6.2",
        "arches": "archesproject/arches#dev/7.6.x",
        "arches_for_science": "archesproject/arches-for-science#dev/2.0.x"
    }
    ```

5. Update urls.py to include the arches-for-science urls
    ```
    urlpatterns = [
        path("", include("arches.urls")),
        path("", include("arches_for_science.urls")),
        path("reports/", include("arches_templating.urls")),
    ] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    ```

6. Install the arches application package (models and other data)
    ```
    python manage.py packages -o load_package -a arches_for_science -dev -y
    ```

7. Start your project
    ```
    python manage.py runserver
    ```

8. Next cd into your project's app directory (the one with package.json) install and build front-end dependencies:
    ```
    npm install
    npm run build_development
    ```