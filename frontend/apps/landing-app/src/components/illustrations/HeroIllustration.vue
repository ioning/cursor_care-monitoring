<template>
  <div class="hero-illustration">
    <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <!-- Background gradient -->
      <defs>
        <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.1" />
        </linearGradient>
      </defs>
      
      <!-- Background circle -->
      <circle cx="400" cy="300" r="250" fill="url(#heroGradient)" opacity="0.5" />
      
      <!-- Person figure -->
      <g transform="translate(400, 300)">
        <!-- Body -->
        <ellipse cx="0" cy="80" rx="40" ry="60" fill="#3b82f6" opacity="0.8" />
        
        <!-- Head -->
        <circle cx="0" cy="-20" r="35" fill="#fbbf24" />
        
        <!-- Heart monitor -->
        <g transform="translate(-60, 20)">
          <rect x="0" y="0" width="120" height="80" rx="8" fill="#ffffff" stroke="#3b82f6" stroke-width="2" />
          <path d="M 20 40 L 40 30 L 60 50 L 80 20 L 100 40" stroke="#ef4444" stroke-width="3" fill="none" />
          <circle cx="30" cy="60" r="3" fill="#10b981" />
          <text x="60" y="65" font-size="12" fill="#6b7280">98%</text>
        </g>
        
        <!-- AI brain icon -->
        <g transform="translate(80, -40)">
          <circle cx="0" cy="0" r="25" fill="#7c3aed" opacity="0.2" />
          <path d="M -15 -10 Q -5 -15 0 -5 Q 5 -15 15 -10 Q 10 5 0 10 Q -10 5 -15 -10" 
                fill="#7c3aed" opacity="0.6" />
          <circle cx="-8" cy="-5" r="2" fill="#ffffff" />
          <circle cx="8" cy="-5" r="2" fill="#ffffff" />
        </g>
        
        <!-- Notification badge -->
        <g transform="translate(60, -60)">
          <circle cx="0" cy="0" r="12" fill="#ef4444" />
          <text x="0" y="4" font-size="10" fill="#ffffff" text-anchor="middle">!</text>
        </g>
        
        <!-- Pulse waves -->
        <g transform="translate(-100, -100)">
          <circle cx="0" cy="0" r="3" fill="#10b981" opacity="0.8">
            <animate attributeName="r" values="3;8;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
        
        <g transform="translate(100, -80)">
          <circle cx="0" cy="0" r="3" fill="#3b82f6" opacity="0.8">
            <animate attributeName="r" values="3;8;3" dur="2s" begin="0.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" begin="0.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
      
      <!-- Floating icons -->
      <g transform="translate(150, 100)">
        <circle cx="0" cy="0" r="30" fill="#ffffff" opacity="0.9" />
        <text x="0" y="8" font-size="24" text-anchor="middle">📊</text>
      </g>
      
      <g transform="translate(650, 150)">
        <circle cx="0" cy="0" r="30" fill="#ffffff" opacity="0.9" />
        <text x="0" y="8" font-size="24" text-anchor="middle">💓</text>
      </g>
      
      <g transform="translate(100, 450)">
        <circle cx="0" cy="0" r="30" fill="#ffffff" opacity="0.9" />
        <text x="0" y="8" font-size="24" text-anchor="middle">📱</text>
      </g>
      
      <g transform="translate(700, 450)">
        <circle cx="0" cy="0" r="30" fill="#ffffff" opacity="0.9" />
        <text x="0" y="8" font-size="24" text-anchor="middle">🛡️</text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
// Hero illustration component
</script>

<style scoped>
.hero-illustration {
  width: 100%;
  max-width: 800px;
  height: auto;
  margin: 0 auto;
}

.hero-illustration svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>




