<template>
  <form class="search" role="search" @submit.prevent="$emit('submit')">
    <label class="sr-only" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      class="search__input"
      type="search"
      :value="modelValue"
      :placeholder="label"
      autocomplete="off"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <button class="search__btn" type="submit" aria-label="Buscar">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2" />
        <path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
      </svg>
    </button>
  </form>
</template>

<script>
export default {
  name: 'SearchBar',
  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: 'Buscar películas' },
    inputId: { type: String, default: 'buscador' }
  },
  emits: ['update:modelValue', 'submit']
};
</script>

<style scoped>
.search { position: relative; display: flex; width: 100%; }
.search__input {
  flex: 1; min-height: 48px; width: 100%;
  padding: 10px 52px 10px 16px;
  background: #e6e6e6; color: var(--black);
  border: 2px solid #e6e6e6; border-radius: 12px; font: inherit; font-size: 1rem;
}
.search__input::placeholder { color: #4a4a4a; opacity: 1; }
.search__btn {
  position: absolute; right: 0; top: 0; width: 48px; height: 48px;
  display: grid; place-items: center; background: transparent; color: var(--black);
  border: 0; border-radius: 12px; cursor: pointer;
}
</style>
