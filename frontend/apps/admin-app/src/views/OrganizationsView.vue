<template>
  <div class="organizations">
    <header>
      <div>
        <h2>Организации</h2>
        <p>Управление организациями и их диспетчерами</p>
      </div>
      <div class="header-actions">
        <button class="primary" @click="showCreateModal = true">
          Создать организацию с диспетчером
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="organizations.length === 0" class="empty">
      <p>Нет организаций</p>
      <button class="primary" @click="showCreateModal = true">Создать первую организацию</button>
    </div>
    <div v-else class="organizations-list">
      <div v-for="org in organizations" :key="org.id" class="organization-card">
        <div class="org-header">
          <h3>{{ org.name }}</h3>
          <span class="status" :class="org.status">{{ org.status }}</span>
        </div>
        <div class="org-info">
          <p><strong>Slug:</strong> {{ org.slug }}</p>
          <p><strong>Тариф:</strong> {{ org.subscriptionTier }}</p>
          <p v-if="org.maxWards"><strong>Лимит подопечных:</strong> {{ org.maxWards }}</p>
          <p v-if="org.maxDispatchers"><strong>Лимит диспетчеров:</strong> {{ org.maxDispatchers }}</p>
          <p v-if="org.contactEmail"><strong>Email:</strong> {{ org.contactEmail }}</p>
          <p v-if="org.contactPhone"><strong>Телефон:</strong> {{ org.contactPhone }}</p>
        </div>
        <div class="org-actions">
          <button class="ghost" @click="editOrganization(org)">Редактировать</button>
        </div>
      </div>
    </div>

    <!-- Modal создания организации -->
    <CreateOrganizationModal v-if="showCreateModal" @close="showCreateModal = false" @created="handleOrganizationCreated" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRealtimeChannel } from '@/composables/useRealtimeChannel';
import { fetchOrganizations, type Organization } from '@/api/organizations.api';
import CreateOrganizationModal from '@/components/organizations/CreateOrganizationModal.vue';

const organizations = ref<Organization[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);

const loadOrganizations = async () => {
  loading.value = true;
  try {
    organizations.value = await fetchOrganizations();
  } catch (error) {
    console.error('Failed to load organizations:', error);
  } finally {
    loading.value = false;
  }
};

const handleOrganizationCreated = () => {
  showCreateModal.value = false;
  loadOrganizations();
};

const editOrganization = (org: Organization) => {
  // TODO: Implement edit functionality
  console.log('Edit organization:', org);
};

// Подключаем realtime обновления
useRealtimeChannel('admin.organizations', () => {
  loadOrganizations();
});

onMounted(() => {
  loadOrganizations();
});
</script>

<style scoped>
.organizations {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.primary {
  border: 0;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(135deg, #3d7fff, #8c5eff);
  color: #fff;
}

.primary:hover {
  opacity: 0.9;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.6);
}

.organizations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.organization-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.org-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.org-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status.active {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.status.trial {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.status.suspended {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.org-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.org-info p {
  margin: 0;
}

.org-info strong {
  color: rgba(255, 255, 255, 0.9);
}

.org-actions {
  display: flex;
  gap: 0.5rem;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-weight: 500;
}

.ghost:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>

