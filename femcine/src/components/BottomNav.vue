<template>
  <nav class="bottom-nav" aria-label="Navegación principal">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'is-active': isActive(item) }"
      :aria-current="isActive(item) ? 'page' : null"
    >
      <svg class="bottom-nav__icon" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
        <path v-if="item.icon === 'home'" d="M3 11.5 12 4l9 7.500V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="currentColor" />
        <g v-else-if="item.icon === 'film'" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3.500" y="3.500" width="17" height="17" rx="2" />
          <path d="M7.500 3.500v17M16.500 3.500v17M3.500 8h4M3.500 12h4M3.500 16h4M16.500 8h4M16.500 12h4M16.500 16h4" />
        </g>
        <g v-else fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="9" cy="8.500" r="3.200" />
          <path d="M3 20c0-3.300 2.700-5.500 6-5.500s6 2.200 6 5.500" />
          <path d="M15.500 5.300a3.200 3.200 0 0 1 0 6.400M17.500 14.800c2.100.7 3.500 2.500 3.500 5.200" />
        </g>
      </svg>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script>
import { NAV_ITEMS, isNavActive } from '@/data/navigation';

export default {
  name: 'BottomNav',
  data() {
    return { items: NAV_ITEMS };
  },
  methods: {
    isActive(item) {
      return isNavActive(item, this.$route.path);
    }
  }
};
</script>

<style scoped>
.bottom-nav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 50;
  display: grid; grid-template-columns: repeat(3, 1fr);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: #fff; color: var(--black); border-top: 3px solid var(--black);
}
.bottom-nav__item {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  min-height: 64px; padding: 6px 4px; text-decoration: none; color: var(--black);
  font-size: 0.8125rem; font-weight: 700;
}
.bottom-nav__item.is-active { background: var(--pink); }
.bottom-nav__item.is-active span { text-decoration: underline; text-underline-offset: 3px; }
@media (min-width: 768px) {
  .bottom-nav { display: none; }
}
</style>
