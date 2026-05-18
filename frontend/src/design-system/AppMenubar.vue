<script setup lang="ts">
import {
  MenubarContent,
  MenubarItem,
  MenubarItemIndicator,
  MenubarMenu,
  MenubarPortal,
  MenubarRoot,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from 'reka-ui'

export interface AppMenubarItem {
  readonly label: string
  readonly value: string
  readonly disabled?: boolean
  readonly separatorBefore?: boolean
  readonly selected?: boolean
  readonly shortcut?: string
  readonly children?: readonly AppMenubarItem[]
}

export interface AppMenubarMenu {
  readonly label: string
  readonly value: string
  readonly items: readonly AppMenubarItem[]
}

const props = withDefaults(defineProps<{
  menus: readonly AppMenubarMenu[]
  ariaLabel?: string
}>(), {
  ariaLabel: 'Menu bar',
})

const emit = defineEmits<{
  select: [{ menuValue: string; itemValue: string }]
}>()

function hasChildren(item: AppMenubarItem): boolean {
  return Array.isArray(item.children) && item.children.length > 0
}
</script>

<template>
  <MenubarRoot
    :aria-label="ariaLabel"
    class="inline-flex items-stretch gap-1 rounded-lg border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-0 shadow-sm"
  >
    <MenubarMenu
      v-for="menu in props.menus"
      :key="menu.value"
      :value="menu.value"
    >
      <MenubarTrigger
        class="flex h-full items-center justify-between gap-1 rounded-md px-3 py-0 text-xs font-semibold leading-none text-[var(--tf-color-text-default)] outline-none transition hover:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_38%,transparent)] data-[highlighted]:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_38%,transparent)] data-[state=open]:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_44%,transparent)]"
      >
        {{ menu.label }}
      </MenubarTrigger>

      <MenubarPortal>
        <MenubarContent
          :align-offset="-3"
          :side-offset="6"
          align="start"
          class="z-[130] min-w-[14rem] rounded-lg border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-[5px] shadow-lg outline-none"
        >
          <template
            v-for="item in menu.items"
            :key="`${menu.value}-${item.value}`"
          >
            <MenubarSeparator
              v-if="item.separatorBefore"
              class="my-1 h-px bg-[var(--tf-color-surface-border)]"
            />

            <MenubarSub v-if="hasChildren(item)">
              <MenubarSubTrigger
                class="group relative flex h-[28px] select-none items-center rounded px-2.5 text-xs leading-none text-[var(--tf-color-text-default)] outline-none transition hover:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_38%,transparent)] data-[state=open]:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_44%,transparent)] data-[highlighted]:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_38%,transparent)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                :disabled="item.disabled"
              >
                {{ item.label }}
                <span class="ml-auto pl-5 text-[var(--tf-color-text-muted)]">›</span>
              </MenubarSubTrigger>

              <MenubarPortal>
                <MenubarSubContent
                  :align-offset="-5"
                  class="z-[130] min-w-[14rem] rounded-lg border border-[var(--tf-color-surface-border)] bg-[var(--tf-color-surface)] p-[5px] shadow-lg outline-none"
                >
                  <template
                    v-for="child in item.children"
                    :key="`${menu.value}-${item.value}-${child.value}`"
                  >
                    <MenubarSeparator
                      v-if="child.separatorBefore"
                      class="my-1 h-px bg-[var(--tf-color-surface-border)]"
                    />

                    <MenubarItem
                      :disabled="child.disabled"
                      class="group relative flex h-[28px] cursor-pointer select-none items-center rounded px-2.5 text-xs leading-none text-[var(--tf-color-text-default)] outline-none transition hover:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_38%,transparent)] data-[state=open]:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_44%,transparent)] data-[highlighted]:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_38%,transparent)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      @select="emit('select', { menuValue: menu.value, itemValue: child.value })"
                    >
                      <span>{{ child.label }}</span>
                      <span
                        v-if="child.shortcut"
                        class="ml-auto pl-5 text-[var(--tf-color-text-muted)]"
                      >
                        {{ child.shortcut }}
                      </span>
                    </MenubarItem>
                  </template>
                </MenubarSubContent>
              </MenubarPortal>
            </MenubarSub>

            <MenubarItem
              v-else
              :disabled="item.disabled"
              class="group relative flex h-[28px] cursor-pointer select-none items-center rounded px-2.5 text-xs leading-none text-[var(--tf-color-text-default)] outline-none transition hover:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_38%,transparent)] data-[state=open]:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_44%,transparent)] data-[highlighted]:bg-[color-mix(in_srgb,var(--tf-color-header-action-bg)_38%,transparent)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              :class="item.selected ? 'bg-[var(--tf-color-surface-alt)] font-semibold' : ''"
              @select="emit('select', { menuValue: menu.value, itemValue: item.value })"
            >
              <MenubarItemIndicator
                v-if="item.selected"
                class="mr-2 inline-flex w-3.5 items-center justify-center text-[var(--tf-color-text-default)]"
              >
                ✓
              </MenubarItemIndicator>
              <span>{{ item.label }}</span>
              <span
                v-if="item.shortcut"
                class="ml-auto pl-5 text-[var(--tf-color-text-muted)]"
              >
                {{ item.shortcut }}
              </span>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
