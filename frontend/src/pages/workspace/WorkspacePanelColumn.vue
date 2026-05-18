<script setup lang="ts">
import AppSplitterGroup from '../../design-system/AppSplitterGroup.vue'
import AppSplitterPanel from '../../design-system/AppSplitterPanel.vue'
import AppSplitterResizeHandle from '../../design-system/AppSplitterResizeHandle.vue'
import WorkspacePanelCard from '../../components/layout/WorkspacePanelCard.vue'

export type WorkspacePanelColumnId = 'left' | 'center' | 'right'

export type WorkspaceColumnPanel = {
  id: string
  title: string
  closable: boolean
  draggable: boolean
}

type SideDropIndicator = {
  column: 'left' | 'right'
  panelIndex: number | null
  edge: 'top' | 'bottom'
}

const props = withDefaults(defineProps<{
  columnId: WorkspacePanelColumnId
  panels: WorkspaceColumnPanel[]
  enableDragDrop?: boolean
  draggedPanelId?: string | null
  dropIndicator?: SideDropIndicator | null
  panelDefaultSize: (panelIndex: number, totalPanels: number) => number
}>(), {
  enableDragDrop: false,
  draggedPanelId: null,
  dropIndicator: null,
})

const emit = defineEmits<{
  close: [panelId: string]
  panelDragStart: [panelId: string, event: DragEvent]
  panelDragEnd: []
  panelDragOver: [panelIndex: number, event: DragEvent]
  panelDrop: [panelIndex: number, event: DragEvent]
  columnDragOver: [totalPanels: number, event: DragEvent]
  columnDrop: [totalPanels: number, event: DragEvent]
}>()

function showDropIndicator(panelIndex: number, edge: 'top' | 'bottom'): boolean {
  const indicator = props.dropIndicator
  return Boolean(
    props.enableDragDrop
    && indicator
    && indicator.column === props.columnId
    && indicator.panelIndex === panelIndex
    && indicator.edge === edge,
  )
}
</script>

<template>
  <div
    class="relative h-full min-h-0 overflow-hidden"
    @dragover="(event) => {
      if (enableDragDrop) {
        emit('columnDragOver', panels.length, event)
      }
    }"
    @drop="(event) => {
      if (enableDragDrop) {
        emit('columnDrop', panels.length, event)
      }
    }"
  >
    <AppSplitterGroup
      v-if="panels.length > 1"
      :auto-save-id="`workspace-${columnId}-column-vertical-${panels.length}`"
      class="h-full min-h-0 w-full"
      direction="vertical"
    >
      <template
        v-for="(panel, index) in panels"
        :key="panel.id"
      >
        <AppSplitterPanel
          :default-size="panelDefaultSize(index, panels.length)"
          :min-size="16"
          class="min-h-0"
        >
          <div
            class="relative flex h-full min-h-0 flex-col overflow-hidden"
            @dragover="(event) => {
              if (enableDragDrop) {
                emit('panelDragOver', index, event)
              }
            }"
            @drop="(event) => {
              if (enableDragDrop) {
                emit('panelDrop', index, event)
              }
            }"
          >
            <div
              v-if="showDropIndicator(index, 'top')"
              data-testid="side-drop-indicator"
              :data-column="columnId"
              data-edge="top"
              class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
            />

            <div class="min-h-0 flex-1">
              <WorkspacePanelCard
                :title="panel.title"
                :closable="panel.closable"
                :draggable="panel.draggable"
                @close="emit('close', panel.id)"
                @dragstart="(event) => emit('panelDragStart', panel.id, event)"
                @dragend="emit('panelDragEnd')"
                @dragover="(event) => {
                  if (enableDragDrop) {
                    emit('panelDragOver', index, event)
                  }
                }"
                @drop="(event) => {
                  if (enableDragDrop) {
                    emit('panelDrop', index, event)
                  }
                }"
              >
                <template #actions>
                  <slot name="actions" :panel="panel" />
                </template>
                <slot :panel="panel" />
              </WorkspacePanelCard>
            </div>

            <div
              v-if="showDropIndicator(index, 'bottom')"
              data-testid="side-drop-indicator"
              :data-column="columnId"
              data-edge="bottom"
              class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
            />
          </div>
        </AppSplitterPanel>

        <AppSplitterResizeHandle
          v-if="index < panels.length - 1"
          class="mx-1 my-1 h-1.5 rounded bg-[var(--tf-color-surface-border)] transition data-[state=drag]:bg-[var(--tf-color-accent)]"
        />
      </template>
    </AppSplitterGroup>

    <div
      v-else-if="panels.length === 1"
      class="relative flex h-full min-h-0 flex-col overflow-hidden"
      @dragover="(event) => {
        if (enableDragDrop) {
          emit('panelDragOver', 0, event)
        }
      }"
      @drop="(event) => {
        if (enableDragDrop) {
          emit('panelDrop', 0, event)
        }
      }"
    >
      <div
        v-if="showDropIndicator(0, 'top')"
        data-testid="side-drop-indicator"
        :data-column="columnId"
        data-edge="top"
        class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
      />

      <WorkspacePanelCard
        :title="panels[0]!.title"
        :closable="panels[0]!.closable"
        :draggable="panels[0]!.draggable"
        @close="emit('close', panels[0]!.id)"
        @dragstart="(event) => emit('panelDragStart', panels[0]!.id, event)"
        @dragend="emit('panelDragEnd')"
        @dragover="(event) => {
          if (enableDragDrop) {
            emit('panelDragOver', 0, event)
          }
        }"
        @drop="(event) => {
          if (enableDragDrop) {
            emit('panelDrop', 0, event)
          }
        }"
      >
        <template #actions>
          <slot name="actions" :panel="panels[0]" />
        </template>
        <slot :panel="panels[0]" />
      </WorkspacePanelCard>

      <div
        v-if="showDropIndicator(0, 'bottom')"
        data-testid="side-drop-indicator"
        :data-column="columnId"
        data-edge="bottom"
        class="mx-2 my-1 h-10 shrink-0 rounded-[8px] border-2 border-dashed border-[var(--tf-color-accent)] bg-[color-mix(in_srgb,var(--tf-color-accent)_12%,transparent)]"
      />
    </div>
  </div>
</template>
