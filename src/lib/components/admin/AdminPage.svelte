<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { getAuth } from '#lib/auth/auth.svelte.ts';
  import { isFacilityUser } from '#lib/auth/roles.ts';
  import { adminAccess } from '#lib/admin-compat/policy.ts';
  import type { AdminPage } from '#lib/admin-compat/runtime.tsx';
  import LegacyAdminPage from './LegacyAdminPage.svelte';
  import Workspace from './workspace/Workspace.svelte';
  let {name}:{name:AdminPage}=$props();
  const auth=getAuth();
  const access=$derived(adminAccess(name,auth.user,auth.isLoading,page.params.id));
  const native=$derived(name==='clinic'||isFacilityUser(auth.user)&&['dashboard','analytics','subscription'].includes(name));
  $effect(()=>{if(access.state==='redirect')void goto(access.href,{replaceState:true});});
</script>
{#if access.state==='loading'}<p role="status" class="p-8 text-center text-muted-foreground">載入後台中…</p>
{:else if access.state==='allow'}{#if native}<Workspace {name} facilityId={name==='clinic'?page.params.id!:auth.user!.facility_id!}/>{:else}<LegacyAdminPage {name}/>{/if}{/if}
