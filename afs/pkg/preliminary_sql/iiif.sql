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
        "manifest": "https://purl.stanford.edu/qm670kv1873/iiif/manifest"
    }',
    'iiif',
    0
);
