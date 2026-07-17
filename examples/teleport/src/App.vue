<script setup lang="ts">
import { ref } from 'vue'

const showModal = ref(false)
const teleportDisabled = ref(false)
const count = ref(0)
</script>

<template>
  <!--
    Teleport targets must appear earlier in the tree than their <Teleport>
    consumers so querySelector can resolve them at mount time.
  -->
  <view
    :style="{
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#f0f2f5',
    }"
  >
    <!--
      Full-screen overlay host. Styles live on the target itself so
      teleported children do not depend on absolute positioning inside
      an empty zero-size mount point (which collapses on Lynx).
    -->
    <view
      id="overlay-root"
      :style="{
        position: 'absolute',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        zIndex: 1000,
        display: showModal ? 'flex' : 'none',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
      }"
      @tap="showModal = false"
    />

    <scroll-view
      scroll-orientation="vertical"
      :style="{ width: '100%', height: '100%', padding: '16px' }"
    >
      <text :style="{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }">
        Teleport Demo
      </text>
      <text :style="{ fontSize: '12px', color: '#666', marginBottom: '20px' }">
        Content inside &lt;Teleport to="#id"&gt; is rendered into the target by
        id — useful for modals and overlays.
      </text>

      <!-- 1. Modal via Teleport -->
      <view :style="{ marginBottom: '24px' }">
        <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }">
          1. Modal Overlay
        </text>
        <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
          Tap Open Modal — the dialog is teleported to #overlay-root, outside
          this scroll-view's stacking context.
        </text>

        <view
          :style="{
            padding: '10px 16px',
            backgroundColor: '#4a90d9',
            borderRadius: '8px',
            alignSelf: 'flex-start',
          }"
          @tap="showModal = true"
        >
          <text :style="{ color: '#fff', fontSize: '14px' }">Open Modal</text>
        </view>

        <Teleport v-if="showModal" to="#overlay-root">
          <view
            :style="{
              width: '280px',
              padding: '20px',
              backgroundColor: '#fff',
              borderRadius: '12px',
            }"
            @tap.stop
          >
            <text :style="{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }">
              Teleported Modal
            </text>
            <text :style="{ fontSize: '13px', color: '#555', marginBottom: '16px' }">
              This content was rendered under #overlay-root via
              &lt;Teleport to="#overlay-root"&gt;.
            </text>
            <view
              :style="{
                padding: '8px 14px',
                backgroundColor: '#4a90d9',
                borderRadius: '6px',
                alignSelf: 'flex-end',
              }"
              @tap="showModal = false"
            >
              <text :style="{ color: '#fff', fontSize: '13px' }">Close</text>
            </view>
          </view>
        </Teleport>
      </view>

      <!-- 2. Reactive content + disabled -->
      <view :style="{ marginBottom: '24px' }">
        <text :style="{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }">
          2. Reactive Content + disabled
        </text>
        <text :style="{ fontSize: '12px', color: '#666', marginBottom: '8px' }">
          Teleported content stays reactive. With :disabled="true", it renders
          in place instead of at the target.
        </text>

        <view :style="{ flexDirection: 'row', marginBottom: '8px' }">
          <view
            :style="{
              padding: '8px 12px',
              marginRight: '8px',
              backgroundColor: '#27ae60',
              borderRadius: '6px',
            }"
            @tap="count++"
          >
            <text :style="{ color: '#fff', fontSize: '13px' }">Count: {{ count }}</text>
          </view>
          <view
            :style="{
              padding: '8px 12px',
              backgroundColor: teleportDisabled ? '#e67e22' : '#95a5a6',
              borderRadius: '6px',
            }"
            @tap="teleportDisabled = !teleportDisabled"
          >
            <text :style="{ color: '#fff', fontSize: '13px' }">
              disabled: {{ teleportDisabled }}
            </text>
          </view>
        </view>

        <view
          id="badge-target"
          :style="{
            minHeight: '48px',
            padding: '8px',
            backgroundColor: '#e8f0fe',
            borderRadius: '8px',
            marginBottom: '8px',
          }"
        >
          <text :style="{ fontSize: '11px', color: '#666' }">#badge-target</text>
        </view>

        <view
          :style="{
            padding: '8px',
            backgroundColor: '#fff3e0',
            borderRadius: '8px',
          }"
        >
          <text :style="{ fontSize: '11px', color: '#666', marginBottom: '4px' }">
            Teleport source (in-tree when disabled)
          </text>
          <Teleport to="#badge-target" :disabled="teleportDisabled">
            <text :style="{ fontSize: '14px', fontWeight: 'bold', color: '#1565c0' }">
              Badge count: {{ count }}
            </text>
          </Teleport>
        </view>
      </view>
    </scroll-view>
  </view>
</template>
