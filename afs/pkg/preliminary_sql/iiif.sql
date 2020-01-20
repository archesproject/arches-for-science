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
    'iiif-viewer',
    'fa fa-globe',
    'views/components/iiif-viewer',
    'iiif-viewer',
    '{}',
    'iiif',
    0
);
