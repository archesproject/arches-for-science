-- DELETE FROM plugins WHERE name='IIIF Viewer';

INSERT INTO plugins(
    pluginid,
    name,
    icon,
    component,
    componentname,
    config,
    slug,
    sortorder
) VALUES (
    public.uuid_generate_v1mc(),
    'IIIF Viewer',
    'fa fa-globe',
    'views/components/iiif-viewer',
    'iiif-viewer',
    '{
        "manifest": "https://data.getty.edu/museum/api/iiif/249995/manifest.json"
    }',
    'iiif',
    0
);
