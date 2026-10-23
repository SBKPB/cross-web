<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto, invalidateAll } from '$app/navigation';
  import { mode, userPrefersMode, setMode } from 'mode-watcher';
  import { getAuth } from '#lib/auth/auth.svelte.ts';
  import type { LegacyPanelName } from '#lib/admin-compat/panels.ts';
  let { name, props={} }: { name:LegacyPanelName;props?:Record<string,unknown> }=$props();
  let element:HTMLDivElement, root=$state<Awaited<ReturnType<typeof import('#lib/admin-compat/panels.ts').createPanel>>|null>(null),error=$state('');
  const auth=getAuth();
  onMount(()=>{let disposed=false;let mounted:typeof root=null;void import('#lib/admin-compat/panels.ts').then(async({createPanel})=>{const instance=await createPanel(element,name);if(disposed)instance.destroy();else{mounted=instance;root=instance;}}).catch(()=>error='設定功能載入失敗，請重新整理後重試');return()=>{disposed=true;mounted?.destroy();};});
  $effect(()=>{root?.render({user:auth.user,isLoading:auth.isLoading,isAuthenticated:auth.isAuthenticated,sessionExpiredMessage:auth.sessionExpiredMessage,login:auth.login,loginWithGoogle:auth.loginWithGoogle,loginWithApple:auth.loginWithApple,register:auth.register,logout:auth.logout,refreshUser:auth.refreshUser,clearSessionExpiredMessage:auth.clearSessionExpiredMessage},{pathname:page.url.pathname,params:page.params,search:page.url.search,router:{push:href=>{void goto(href);},replace:href=>{void goto(href,{replaceState:true});},back:()=>history.back(),refresh:()=>{void invalidateAll();}},theme:userPrefersMode.current??'system',resolvedTheme:mode.current??'light',setTheme:value=>{if(value==='light'||value==='dark'||value==='system')setMode(value);}},props);});
</script>
{#if error}<p role="alert" class="rounded-xl bg-destructive/10 p-3 text-destructive">{error}</p>{:else if !root}<p role="status" class="py-8 text-center text-muted-foreground">載入設定中…</p>{/if}<div bind:this={element}></div>
