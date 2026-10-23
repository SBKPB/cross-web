<script lang="ts">
  import { onMount } from 'svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { mode, userPrefersMode, setMode } from 'mode-watcher';
  import { getAuth } from '#lib/auth/auth.svelte.ts';
  import type { AdminPage } from '#lib/admin-compat/runtime.tsx';
  import type { NavigationState } from '#lib/admin-compat/navigation.ts';
  import type { AdminAuth } from '#lib/admin-compat/auth.ts';
  import { adminAccess } from '#lib/admin-compat/policy.ts';
  let { name }: { name: AdminPage } = $props();
  let element: HTMLDivElement;
  let root = $state<Awaited<ReturnType<typeof import('#lib/admin-compat/runtime.tsx').createAdminRoot>> | null>(null);
  let error = $state('');
  const auth = getAuth();
  const access = $derived(adminAccess(name, auth.user, auth.isLoading, page.params.id));
  $effect(() => { if (access.state === 'redirect') void goto(access.href, { replaceState: true }); });
  const router = {
    push: (href: string) => { void goto(href); },
    replace: (href: string) => { void goto(href, { replaceState: true }); },
    back: () => history.back(),
    refresh: () => { void invalidateAll(); },
  };
  const setTheme = (value: string) => {
    if (value === 'light' || value === 'dark' || value === 'system') setMode(value);
  };
  onMount(() => {
    let disposed = false;
    let mounted: typeof root = null;
    void import('#lib/admin-compat/runtime.tsx').then(async ({ createAdminRoot }) => {
      const instance = await createAdminRoot(element, name);
      if (disposed) instance.destroy();
      else { mounted = instance; root = instance; }
    }).catch(() => { if (!disposed) error = '後台載入失敗，請重新整理後再試。'; });
    return () => { disposed = true; mounted?.destroy(); };
  });
  $effect(() => {
    const value: AdminAuth = {
      user: auth.user, isLoading: auth.isLoading, isAuthenticated: auth.isAuthenticated,
      sessionExpiredMessage: auth.sessionExpiredMessage,
      login: auth.login, loginWithGoogle: auth.loginWithGoogle, loginWithApple: auth.loginWithApple,
      register: auth.register, logout: auth.logout, refreshUser: auth.refreshUser,
      clearSessionExpiredMessage: auth.clearSessionExpiredMessage,
    };
    const navigation: NavigationState = { pathname: page.url.pathname, params: page.params, search: page.url.search, router,
      theme: userPrefersMode.current ?? 'system', resolvedTheme: mode.current ?? 'light', setTheme };
    if (access.state === 'allow') root?.render(value, navigation);
    else root?.clear();
  });
</script>

{#if error}<p role="alert" class="p-8 text-center text-destructive">{error}</p>{/if}
{#if access.state === 'loading' || (!root && !error)}<p class="p-8 text-center text-muted-foreground" role="status">載入後台中…</p>{/if}
<div bind:this={element}></div>
