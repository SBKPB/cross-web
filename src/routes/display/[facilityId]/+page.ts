import type { PageLoad } from './$types';
export const load: PageLoad = ({ params }) => ({ seo: {
  title: '候診叫號看板', description: '現場候診室叫號大螢幕', canonical: `/display/${params.facilityId}`, noindex: true,
} });
