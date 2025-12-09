<template>
  <div class="business-illustration">
    <svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="businessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      
      <rect width="500" height="400" rx="20" fill="url(#businessGradient)" />
      
      <!-- Building/Organization -->
      <g transform="translate(100, 150)">
        <!-- Building -->
        <rect x="0" y="0" width="300" height="200" rx="8" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
        <rect x="20" y="20" width="60" height="80" rx="4" fill="#e5e7eb" />
        <rect x="100" y="20" width="60" height="80" rx="4" fill="#e5e7eb" />
        <rect x="180" y="20" width="60" height="80" rx="4" fill="#e5e7eb" />
        <rect x="260" y="20" width="20" height="160" rx="4" fill="#3b82f6" />
        
        <!-- Door -->
        <rect x="130" y="120" width="40" height="80" rx="4" fill="#1f2937" />
        <circle cx="160" cy="160" r="3" fill="#ffffff" />
      </g>
      
      <!-- People/Users -->
      <g transform="translate(50, 250)">
        <circle cx="0" cy="0" r="15" fill="#fbbf24" />
        <ellipse cx="0" cy="25" rx="12" ry="20" fill="#3b82f6" />
      </g>
      
      <g transform="translate(150, 250)">
        <circle cx="0" cy="0" r="15" fill="#fbbf24" />
        <ellipse cx="0" cy="25" rx="12" ry="20" fill="#3b82f6" />
      </g>
      
      <g transform="translate(250, 250)">
        <circle cx="0" cy="0" r="15" fill="#fbbf24" />
        <ellipse cx="0" cy="25" rx="12" ry="20" fill="#3b82f6" />
      </g>
      
      <g transform="translate(350, 250)">
        <circle cx="0" cy="0" r="15" fill="#fbbf24" />
        <ellipse cx="0" cy="25" rx="12" ry="20" fill="#3b82f6" />
      </g>
      
      <!-- Connection lines -->
      <line x1="50" y1="250" x2="100" y2="200" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
      <line x1="150" y1="250" x2="150" y2="200" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
      <line x1="250" y1="250" x2="250" y2="200" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
      <line x1="350" y1="250" x2="300" y2="200" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
      
      <!-- Chart/Stats -->
      <g transform="translate(400, 50)">
        <rect x="0" y="0" width="80" height="100" rx="8" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
        <rect x="10" y="70" width="15" height="20" fill="#3b82f6" />
        <rect x="30" y="50" width="15" height="40" fill="#7c3aed" />
        <rect x="50" y="60" width="15" height="30" fill="#10b981" />
        <text x="40" y="25" font-size="12" fill="#6b7280" text-anchor="middle" font-weight="bold">KPI</text>
      </g>
      
      <!-- Shield/Security -->
      <g transform="translate(420, 200)">
        <path d="M 0 0 L 20 -30 L 40 0 L 40 40 L 0 40 Z" fill="#10b981" opacity="0.8" />
        <path d="M 20 -20 L 15 -10 L 20 -5 L 25 -10 Z" fill="#ffffff" />
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
  height: 400px;
  margin: 0 auto;
}

.business-illustration svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>




