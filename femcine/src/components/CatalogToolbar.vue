<template>
  <div class="toolbar">
    <div class="toolbar__group" role="group" aria-labelledby="tb-categorias">
      <p id="tb-categorias" class="toolbar__label">Categoría editorial</p>
      <div class="toolbar__chips">
        <button type="button" class="chip" :aria-pressed="category === '' && !onlyFavorites ? 'true' : 'false'" @click="onClearCategory">
          Todas
        </button>
        <button
          v-for="item in categories"
          :key="item.id"
          type="button"
          class="chip"
          :aria-pressed="category === item.id && !onlyFavorites ? 'true' : 'false'"
          @click="onSelectCategory(item.id)"
        >
          {{ item.label }}
        </button>
        <button
          type="button"
          class="chip chip--fav"
          :aria-pressed="onlyFavorites ? 'true' : 'false'"
          @click="$emit('update:favorites', !onlyFavorites)"
        >
          ♥ Favoritas <span v-if="favoritesCount">({{ favoritesCount }})</span>
        </button>
      </div>
    </div>
    <div class="toolbar__sort">
      <label class="toolbar__label" for="orden">Ordenar por</label>
      <select id="orden" class="select" :value="sort" @change="$emit('update:sort', $event.target.value)">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CatalogToolbar',
  props: {
    category: { type: String, default: '' },
    sort: { type: String, required: true },
    categories: { type: Array, required: true },
    sortOptions: { type: Array, required: true },
    onlyFavorites: { type: Boolean, default: false },
    favoritesCount: { type: Number, default: 0 }
  },
  emits: ['update:category', 'update:sort', 'update:favorites'],
  methods: {
    onClearCategory() {
      if (this.onlyFavorites) {
        this.$emit('update:favorites', false);
      }
      this.$emit('update:category', '');
    },
    onSelectCategory(id) {
      if (this.onlyFavorites) {
        this.$emit('update:favorites', false);
      }
      this.$emit('update:category', id);
    }
  }
};
</script>

<style scoped>
.toolbar { display: grid; gap: 20px; }
.toolbar__label { margin: 0 0 8px; display: block; font-weight: 700; }
.toolbar__chips { display: flex; flex-wrap: wrap; gap: 10px; }
.chip {
  min-height: 44px; padding: 8px 18px; border-radius: 999px;
  background: transparent; color: var(--white); border: 2px solid var(--white);
  font: inherit; font-weight: 700; cursor: pointer;
}
.chip:hover { border-color: var(--pink); }
.chip[aria-pressed='true'] { background: var(--pink); border-color: var(--pink); color: var(--black); }
@media (min-width: 900px) {
  .toolbar { grid-template-columns: 1fr 280px; align-items: end; }
}
</style>
