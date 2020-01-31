DELETE FROM plugins WHERE name='IIIF Viewer';

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
        "manifest": "https://d.lib.ncsu.edu/collections/catalog/nubian-message-1992-11-30/manifest"
    }',
    'iiif',
    0
);
