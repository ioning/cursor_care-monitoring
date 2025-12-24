<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal glass-panel">
      <header>
        <h3>Создать организацию с диспетчером</h3>
        <button class="close-btn" @click="emit('close')">×</button>
      </header>

      <form @submit.prevent="handleSubmit" class="form">
        <div v-if="error" class="error-message">{{ error }}</div>

        <div class="section">
          <h4>Информация об организации</h4>
          <div class="form-group">
            <label>Название организации *</label>
            <input v-model="form.name" type="text" required placeholder="Например: Медицинский центр №1" />
          </div>

          <div class="form-group">
            <label>Slug (уникальный идентификатор) *</label>
            <input
              v-model="form.slug"
              type="text"
              required
              pattern="[a-z0-9-]+"
              placeholder="medical-center-1"
              @input="form.slug = form.slug.toLowerCase().replace(/[^a-z0-9-]/g, '')"
            />
            <small>Только строчные буквы, цифры и дефисы</small>
          </div>

          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="form.description" placeholder="Описание организации" rows="3"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Тарифный план</label>
              <select v-model="form.subscriptionTier">
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div class="form-group">
              <label>Пробный период (дней)</label>
              <input v-model.number="form.trialDays" type="number" min="0" max="90" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Лимит подопечных</label>
              <input v-model.number="form.maxWards" type="number" min="0" />
            </div>

            <div class="form-group">
              <label>Лимит диспетчеров</label>
              <input v-model.number="form.maxDispatchers" type="number" min="0" />
            </div>
          </div>

          <div class="form-group">
            <label>Email для связи</label>
            <input v-model="form.contactEmail" type="email" placeholder="contact@example.com" />
          </div>

          <div class="form-group">
            <label>Телефон</label>
            <input v-model="form.contactPhone" type="tel" placeholder="+7 (999) 123-45-67" />
          </div>

          <div class="form-group">
            <label>Серийные номера устройств</label>
            <textarea
              v-model="serialNumbersText"
              placeholder="Введите серийные номера через запятую или каждое с новой строки&#10;Например: SN123456, SN789012 или&#10;SN123456&#10;SN789012"
              rows="5"
              @blur="parseSerialNumbers"
            ></textarea>
            <small>Устройства с этими серийными номерами автоматически будут привязаны к этой организации</small>
            <div v-if="form.deviceSerialNumbers && form.deviceSerialNumbers.length > 0" class="serial-numbers-list">
              <span v-for="(sn, idx) in form.deviceSerialNumbers" :key="idx" class="serial-number-tag">
                {{ sn }}
                <button type="button" @click="removeSerialNumber(idx)" class="remove-sn">×</button>
              </span>
            </div>
          </div>
        </div>

        <div class="section">
          <h4>Диспетчер</h4>
          <div class="form-group">
            <label>Email диспетчера *</label>
            <input v-model="form.dispatcher.email" type="email" required placeholder="dispatcher@example.com" />
          </div>

          <div class="form-group">
            <label>Пароль *</label>
            <input
              v-model="form.dispatcher.password"
              type="password"
              required
              minlength="8"
              placeholder="Минимум 8 символов"
            />
          </div>

          <div class="form-group">
            <label>ФИО диспетчера *</label>
            <input v-model="form.dispatcher.fullName" type="text" required placeholder="Иванов Иван Иванович" />
          </div>

          <div class="form-group">
            <label>Телефон диспетчера</label>
            <input v-model="form.dispatcher.phone" type="tel" placeholder="+7 (999) 123-45-67" />
          </div>
        </div>

        <footer>
          <button type="button" class="ghost" @click="emit('close')">Отмена</button>
          <button type="submit" class="primary" :disabled="loading">
            {{ loading ? 'Создание...' : 'Создать организацию' }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { createOrganizationWithDispatcher, type SubscriptionTier } from '@/api/organizations.api';

const emit = defineEmits<{ (e: 'close'): void; (e: 'created'): void }>();

const loading = ref(false);
const error = ref<string | null>(null);
const serialNumbersText = ref('');

const form = reactive({
  name: '',
  slug: '',
  description: '',
  subscriptionTier: 'professional' as SubscriptionTier,
  maxWards: undefined as number | undefined,
  maxDispatchers: undefined as number | undefined,
  maxGuardians: undefined as number | undefined,
  contactEmail: '',
  contactPhone: '',
  deviceSerialNumbers: [] as string[],
  trialDays: 0,
  dispatcher: {
    email: '',
    password: '',
    fullName: '',
    phone: '',
  },
});

const parseSerialNumbers = () => {
  if (!serialNumbersText.value.trim()) {
    form.deviceSerialNumbers = [];
    return;
  }
  
  // Парсим серийные номера из текста (разделенные запятыми, пробелами или переносами строк)
  const numbers = serialNumbersText.value
    .split(/[,;\n\r]+/)
    .map((sn) => sn.trim())
    .filter((sn) => sn.length > 0);
  
  form.deviceSerialNumbers = [...new Set(numbers)]; // Удаляем дубликаты
};

const removeSerialNumber = (index: number) => {
  form.deviceSerialNumbers.splice(index, 1);
  // Обновляем текст
  serialNumbersText.value = form.deviceSerialNumbers.join(', ');
};

const handleSubmit = async () => {
  parseSerialNumbers(); // Парсим перед отправкой
  error.value = null;
  loading.value = true;

  try {
    await createOrganizationWithDispatcher({
      name: form.name,
      slug: form.slug,
      description: form.description || undefined,
      subscriptionTier: form.subscriptionTier,
      maxWards: form.maxWards || undefined,
      maxDispatchers: form.maxDispatchers || undefined,
      maxGuardians: form.maxGuardians || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      deviceSerialNumbers: form.deviceSerialNumbers.length > 0 ? form.deviceSerialNumbers : undefined,
      trialDays: form.trialDays || undefined,
      dispatcher: {
        email: form.dispatcher.email,
        password: form.dispatcher.password,
        fullName: form.dispatcher.fullName,
        phone: form.dispatcher.phone || undefined,
      },
    });

    emit('created');
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'Ошибка при создании организации';
    console.error('Create organization error:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal {
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem;
  border-radius: 12px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #fff;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section:last-of-type {
  border-bottom: 0;
}

.section h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.9);
}

.form-group input,
.form-group select,
.form-group textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 0.75rem;
  color: #fff;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #8c5eff;
  box-shadow: 0 0 0 3px rgba(140, 94, 255, 0.1);
}

.form-group small {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-top: 0.25rem;
}

.serial-numbers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.serial-number-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: rgba(140, 94, 255, 0.2);
  border: 1px solid rgba(140, 94, 255, 0.3);
  border-radius: 6px;
  font-size: 0.875rem;
  color: #fff;
}

.remove-sn {
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 1.125rem;
  line-height: 1;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.remove-sn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.error-message {
  background: rgba(220, 38, 38, 0.2);
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.ghost,
.primary {
  border: 0;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.ghost:hover {
  background: rgba(255, 255, 255, 0.12);
}

.primary {
  background: linear-gradient(135deg, #3d7fff, #8c5eff);
  color: #fff;
}

.primary:hover:not(:disabled) {
  opacity: 0.9;
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

