<template>
  <div class="business-illustration">
    <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="businessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.10" />
          <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.16" />
        </linearGradient>

        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#0f172a" flood-opacity="0.16" />
        </filter>

        <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#3b82f6" opacity="0.10" />
        </pattern>
      </defs>
      
      <!-- Background -->
      <rect width="500" height="400" rx="22" fill="url(#businessGradient)" />
      <rect width="500" height="400" rx="22" fill="url(#dots)" opacity="0.82" />
      <rect x="12" y="12" width="476" height="376" rx="18" fill="none" stroke="#ffffff" opacity="0.55" />

      <!-- Soft blobs -->
      <circle cx="120" cy="110" r="92" fill="#3b82f6" opacity="0.10" />
      <circle cx="410" cy="120" r="86" fill="#7c3aed" opacity="0.10" />

      <!-- Main dashboard (unified premium style) -->
      <g filter="url(#softShadow)">
        <!-- Card -->
        <rect x="70" y="110" width="360" height="220" rx="22" fill="#ffffff" opacity="0.94" />
        <rect x="70" y="110" width="360" height="220" rx="22" fill="#7c3aed" opacity="0.06" />
        <rect x="70" y="110" width="360" height="220" rx="22" fill="none" stroke="rgba(15, 23, 42, 0.22)" stroke-width="2" />

        <!-- Sidebar -->
        <rect x="92" y="132" width="78" height="176" rx="16" fill="#0f172a" opacity="0.06" />
        <rect x="100" y="148" width="62" height="10" rx="5" fill="#3b82f6" opacity="0.32" />
        <rect x="100" y="170" width="52" height="10" rx="5" fill="#0f172a" opacity="0.14" />
        <rect x="100" y="192" width="58" height="10" rx="5" fill="#0f172a" opacity="0.12" />
        <rect x="100" y="214" width="46" height="10" rx="5" fill="#0f172a" opacity="0.10" />

        <!-- Content area header -->
        <rect x="186" y="138" width="224" height="16" rx="8" fill="#0f172a" opacity="0.10" />
        <rect x="186" y="160" width="140" height="10" rx="5" fill="#0f172a" opacity="0.08" />

        <!-- KPI mini cards -->
        <rect x="186" y="182" width="102" height="58" rx="16" fill="#3b82f6" opacity="0.10" />
        <rect x="196" y="196" width="56" height="10" rx="5" fill="#3b82f6" opacity="0.40" />
        <rect x="196" y="214" width="38" height="10" rx="5" fill="#0f172a" opacity="0.10" />

        <rect x="304" y="182" width="106" height="58" rx="16" fill="#7c3aed" opacity="0.10" />
        <rect x="314" y="196" width="60" height="10" rx="5" fill="#7c3aed" opacity="0.38" />
        <rect x="314" y="214" width="42" height="10" rx="5" fill="#0f172a" opacity="0.10" />

        <!-- Chart -->
        <rect x="186" y="252" width="224" height="56" rx="18" fill="#ffffff" opacity="0.92" />
        <rect x="186" y="252" width="224" height="56" rx="18" fill="#3b82f6" opacity="0.06" />
        <path
          d="M 198 296 L 214 286 L 232 290 L 250 274 L 270 280 L 288 266 L 306 272 L 326 258 L 348 266 L 368 256 L 396 268"
          stroke="#3b82f6"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
          opacity="0.85"
        />
        <path d="M 198 276 H 398" stroke="rgba(15, 23, 42, 0.14)" stroke-width="2" stroke-linecap="round" opacity="0.45" />

        <!-- Network nodes (organization + teams) -->
        <circle cx="122" cy="344" r="10" fill="#3b82f6" opacity="0.92" />
        <circle cx="168" cy="360" r="7" fill="#7c3aed" opacity="0.78" />
        <circle cx="214" cy="344" r="7" fill="#3b82f6" opacity="0.72" />
        <circle cx="260" cy="362" r="7" fill="#7c3aed" opacity="0.74" />
        <path d="M 132 344 C 146 350 154 356 162 360" stroke="rgba(37, 99, 235, 0.45)" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 132 344 C 160 340 182 340 207 344" stroke="rgba(37, 99, 235, 0.35)" stroke-width="2" stroke-linecap="round" fill="none" />
        <path d="M 218 344 C 232 350 244 356 254 362" stroke="rgba(124, 58, 237, 0.35)" stroke-width="2" stroke-linecap="round" fill="none" />

        <!-- Security badge -->
        <g transform="translate(382, 316)">
          <path
            d="M 0 10 C 0 4 4 0 10 0 H 36 C 42 0 46 4 46 10 V 32 C 46 38 42 42 36 42 H 10 C 4 42 0 38 0 32 Z"
            fill="#10b981"
            opacity="0.12"
          />
          <path
            d="M 10 6 H 36 C 39.3 6 42 8.7 42 12 V 30 C 42 33.3 39.3 36 36 36 H 10 C 6.7 36 4 33.3 4 30 V 12 C 4 8.7 6.7 6 10 6 Z"
            fill="#10b981"
            opacity="0.18"
          />
          <path
            d="M 14 22 L 20 28 L 32 16"
            stroke="#10b981"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
            opacity="0.95"
          />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
// Business illustration component
</script>

<style scoped>
.business-illustration {
  width: 100%;
  height: 360px;
  margin: 0 auto;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.10);
}

.business-illustration svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>




