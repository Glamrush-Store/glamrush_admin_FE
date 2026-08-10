<script setup>
import { PERMISSION_ACTION_ORDER } from "~/constants/accessControl";

const props = defineProps({
  permissions: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:selected"]);

const search = shallowRef("");

const selectedSet = computed(() => new Set(props.selected));
const actions = computed(() => {
  const actionSet = new Set(props.permissions.map((permission) => permission.action).filter(Boolean));
  return [
    ...PERMISSION_ACTION_ORDER.filter((action) => actionSet.has(action)),
    ...[...actionSet].filter((action) => !PERMISSION_ACTION_ORDER.includes(action)).sort(),
  ];
});

const groupedPermissions = computed(() => {
  const needle = search.value.trim().toLowerCase();
  const groups = new Map();

  props.permissions.forEach((permission) => {
    const resource = permission.resource || "Other";
    const haystack = `${resource} ${permission.action} ${permission.name}`.toLowerCase();
    if (needle && !haystack.includes(needle)) return;

    if (!groups.has(resource)) groups.set(resource, {});
    groups.get(resource)[permission.action] = permission;
  });

  return [...groups.entries()]
    .map(([resource, permissionsByAction]) => ({ resource, permissionsByAction }))
    .sort((left, right) => left.resource.localeCompare(right.resource));
});

const visiblePermissions = computed(() =>
  groupedPermissions.value.flatMap((group) => Object.values(group.permissionsByAction))
);

const allVisibleSelected = computed(() =>
  visiblePermissions.value.length > 0 && visiblePermissions.value.every((permission) => selectedSet.value.has(permission.name))
);

function updateSelection(nextSet) {
  emit("update:selected", [...nextSet].sort());
}

function togglePermission(permission) {
  if (props.disabled || !permission) return;
  const next = new Set(selectedSet.value);
  if (next.has(permission.name)) next.delete(permission.name);
  else next.add(permission.name);
  updateSelection(next);
}

function selectResource(group) {
  if (props.disabled) return;
  const next = new Set(selectedSet.value);
  Object.values(group.permissionsByAction).forEach((permission) => next.add(permission.name));
  updateSelection(next);
}

function clearResource(group) {
  if (props.disabled) return;
  const next = new Set(selectedSet.value);
  Object.values(group.permissionsByAction).forEach((permission) => next.delete(permission.name));
  updateSelection(next);
}

function toggleVisible() {
  if (props.disabled) return;
  const next = new Set(selectedSet.value);
  if (allVisibleSelected.value) {
    visiblePermissions.value.forEach((permission) => next.delete(permission.name));
  } else {
    visiblePermissions.value.forEach((permission) => next.add(permission.name));
  }
  updateSelection(next);
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <label class="text-sm font-medium text-slate-700">Search permissions</label>
        <InputText v-model="search" placeholder="Search resource, action, or permission..." :disabled="disabled" class="w-full" />
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Tag :value="`${selected.length} selected`" severity="info" />
        <Button
          :label="allVisibleSelected ? 'Clear Visible' : 'Select All Visible'"
          icon="pi pi-check-square"
          severity="secondary"
          outlined
          :disabled="disabled || visiblePermissions.length === 0"
          @click="toggleVisible"
        />
      </div>
    </div>

    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full min-w-[760px] border-collapse text-sm">
        <thead class="bg-slate-100 text-left text-slate-600">
          <tr>
            <th class="w-56 px-4 py-3 font-semibold">Resource</th>
            <th v-for="action in actions" :key="action" class="px-4 py-3 text-center font-semibold">{{ action }}</th>
            <th class="w-48 px-4 py-3 text-right font-semibold">Bulk</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!groupedPermissions.length">
            <td :colspan="actions.length + 2" class="px-4 py-10 text-center text-slate-500">
              No permissions match your search.
            </td>
          </tr>
          <tr v-for="group in groupedPermissions" :key="group.resource" class="border-t border-slate-100">
            <td class="px-4 py-3 font-semibold text-slate-900">{{ group.resource }}</td>
            <td v-for="action in actions" :key="`${group.resource}-${action}`" class="px-4 py-3 text-center">
              <Checkbox
                v-if="group.permissionsByAction[action]"
                :model-value="selectedSet.has(group.permissionsByAction[action].name)"
                binary
                :disabled="disabled"
                :aria-label="group.permissionsByAction[action].name"
                @update:model-value="togglePermission(group.permissionsByAction[action])"
              />
              <span v-else class="inline-block h-1 w-6 rounded-full bg-slate-200" aria-label="Permission unavailable" />
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-1">
                <Button label="All" size="small" severity="secondary" text :disabled="disabled" @click="selectResource(group)" />
                <Button label="Clear" size="small" severity="secondary" text :disabled="disabled" @click="clearResource(group)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
