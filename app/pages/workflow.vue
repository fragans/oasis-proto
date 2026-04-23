<template>
  <div class="workflow-container">
    <div class="content-wrap">
      <p class="eyebrow">
        Campaign Lifecycle · Oasis Platform
      </p>
      <h1>Campaign Creation to Delivery</h1>
      <p class="subtitle">
        From marketer input in oasis-proto through edge delivery to the visitor's browser.
      </p>

      <div class="diagram-wrap">
        <svg
          viewBox="0 0 1040 620"
          width="1040"
          height="620"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <!-- Arrow markers -->
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 8 3, 0 6"
                fill="#4f5d75"
              />
            </marker>
            <marker
              id="arrow-accent"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 8 3, 0 6"
                fill="#eb6c36"
              />
            </marker>
            <marker
              id="arrow-link"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon
                points="0 0, 8 3, 0 6"
                fill="#2e5aa8"
              />
            </marker>
          </defs>

          <!-- Page background -->
          <rect
            width="1040"
            height="620"
            fill="#f5f5f5"
          />

          <!-- ── LANE BACKGROUNDS ── -->
          <rect
            x="0"
            y="44"
            width="1040"
            height="120"
            fill="rgba(45,49,66,0.025)"
            rx="0"
          />
          <rect
            x="0"
            y="164"
            width="1040"
            height="120"
            fill="rgba(45,49,66,0.015)"
            rx="0"
          />
          <rect
            x="0"
            y="284"
            width="1040"
            height="100"
            fill="rgba(45,49,66,0.025)"
            rx="0"
          />
          <rect
            x="0"
            y="384"
            width="1040"
            height="116"
            fill="rgba(45,49,66,0.015)"
            rx="0"
          />
          <rect
            x="0"
            y="500"
            width="1040"
            height="84"
            fill="rgba(45,49,66,0.025)"
            rx="0"
          />

          <!-- Lane dividers -->
          <line
            x1="0"
            y1="44"
            x2="1040"
            y2="44"
            stroke="rgba(45,49,66,0.12)"
            stroke-width="1"
          />
          <line
            x1="0"
            y1="164"
            x2="1040"
            y2="164"
            stroke="rgba(45,49,66,0.12)"
            stroke-width="1"
          />
          <line
            x1="0"
            y1="284"
            x2="1040"
            y2="284"
            stroke="rgba(45,49,66,0.12)"
            stroke-width="1"
          />
          <line
            x1="0"
            y1="384"
            x2="1040"
            y2="384"
            stroke="rgba(45,49,66,0.12)"
            stroke-width="1"
          />
          <line
            x1="0"
            y1="500"
            x2="1040"
            y2="500"
            stroke="rgba(45,49,66,0.12)"
            stroke-width="1"
          />
          <line
            x1="0"
            y1="584"
            x2="1040"
            y2="584"
            stroke="rgba(45,49,66,0.12)"
            stroke-width="1"
          />

          <!-- Lane labels column -->
          <rect
            x="0"
            y="44"
            width="96"
            height="540"
            fill="rgba(45,49,66,0.04)"
          />
          <line
            x1="96"
            y1="44"
            x2="96"
            y2="584"
            stroke="rgba(45,49,66,0.18)"
            stroke-width="1"
          />

          <!-- Lane label texts -->
          <text
            transform="translate(16, 104) rotate(-90)"
            text-anchor="middle"
            font-family="monospace"
            font-size="8"
            font-weight="500"
            letter-spacing="0.14em"
            fill="#4f5d75"
          >MARKETER</text>
          <text
            transform="translate(16, 230) rotate(-90)"
            text-anchor="middle"
            font-family="monospace"
            font-size="8"
            font-weight="500"
            letter-spacing="0.14em"
            fill="#4f5d75"
          >OASIS-PROTO API</text>
          <text
            transform="translate(16, 340) rotate(-90)"
            text-anchor="middle"
            font-family="monospace"
            font-size="8"
            font-weight="500"
            letter-spacing="0.14em"
            fill="#4f5d75"
          >CLOUDFLARE KV</text>
          <text
            transform="translate(16, 448) rotate(-90)"
            text-anchor="middle"
            font-family="monospace"
            font-size="8"
            font-weight="500"
            letter-spacing="0.14em"
            fill="#4f5d75"
          >OASIS-EDGE</text>
          <text
            transform="translate(16, 550) rotate(-90)"
            text-anchor="middle"
            font-family="monospace"
            font-size="8"
            font-weight="500"
            letter-spacing="0.14em"
            fill="#4f5d75"
          >VISITOR BROWSER</text>

          <!-- STEP 1 — Create Campaign -->
          <rect
            x="108"
            y="64"
            width="120"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="108"
            y="64"
            width="120"
            height="80"
            rx="6"
            fill="rgba(127,131,153,0.10)"
            stroke="#7a8399"
            stroke-width="1"
          />
          <rect
            x="116"
            y="72"
            width="36"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(122,131,153,0.5)"
            stroke-width="0.8"
          />
          <text
            x="134"
            y="81"
            font-family="monospace"
            font-size="7"
            fill="rgba(122,131,153,0.9)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >UI</text>
          <text
            x="168"
            y="118"
            font-family="sans-serif"
            font-size="12"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >Create Campaign</text>
          <text
            x="168"
            y="132"
            font-family="monospace"
            font-size="9"
            fill="#4f5d75"
            text-anchor="middle"
          >name · type · template</text>

          <!-- STEP 2 — Wizard Steps -->
          <rect
            x="252"
            y="64"
            width="136"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="252"
            y="64"
            width="136"
            height="80"
            rx="6"
            fill="rgba(235,108,54,0.08)"
            stroke="#eb6c36"
            stroke-width="1.2"
          />
          <rect
            x="260"
            y="72"
            width="44"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(235,108,54,0.5)"
            stroke-width="0.8"
          />
          <text
            x="282"
            y="81"
            font-family="monospace"
            font-size="7"
            fill="rgba(235,108,54,0.9)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >WIZARD</text>
          <text
            x="320"
            y="114"
            font-family="sans-serif"
            font-size="12"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >Configure</text>
          <text
            x="320"
            y="128"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >target · trigger · goal</text>

          <!-- STEP 3 — Upload Creative -->
          <rect
            x="412"
            y="64"
            width="120"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="412"
            y="64"
            width="120"
            height="80"
            rx="6"
            fill="rgba(127,131,153,0.10)"
            stroke="#7a8399"
            stroke-width="1"
          />
          <rect
            x="420"
            y="72"
            width="52"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(122,131,153,0.5)"
            stroke-width="0.8"
          />
          <text
            x="446"
            y="81"
            font-family="monospace"
            font-size="7"
            fill="rgba(122,131,153,0.9)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >UPLOAD</text>
          <text
            x="472"
            y="114"
            font-family="sans-serif"
            font-size="12"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >Add Creative</text>
          <text
            x="472"
            y="128"
            font-family="monospace"
            font-size="9"
            fill="#4f5d75"
            text-anchor="middle"
          >image / HTML asset</text>

          <!-- STEP 4 — Launch -->
          <rect
            x="556"
            y="64"
            width="120"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="556"
            y="64"
            width="120"
            height="80"
            rx="6"
            fill="rgba(127,131,153,0.10)"
            stroke="#7a8399"
            stroke-width="1"
          />
          <rect
            x="564"
            y="72"
            width="44"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(122,131,153,0.5)"
            stroke-width="0.8"
          />
          <text
            x="586"
            y="81"
            font-family="monospace"
            font-size="7"
            fill="rgba(122,131,153,0.9)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >ACTION</text>
          <text
            x="616"
            y="114"
            font-family="sans-serif"
            font-size="12"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >Set Live</text>
          <text
            x="616"
            y="128"
            font-family="monospace"
            font-size="9"
            fill="#4f5d75"
            text-anchor="middle"
          >status → active</text>

          <!-- MARKETER ROW ARROWS -->
          <line
            x1="228"
            y1="104"
            x2="250"
            y2="104"
            stroke="#4f5d75"
            stroke-width="1.2"
            marker-end="url(#arrow)"
          />
          <line
            x1="388"
            y1="104"
            x2="410"
            y2="104"
            stroke="#4f5d75"
            stroke-width="1.2"
            marker-end="url(#arrow)"
          />
          <line
            x1="532"
            y1="104"
            x2="554"
            y2="104"
            stroke="#4f5d75"
            stroke-width="1.2"
            marker-end="url(#arrow)"
          />

          <!-- API Node A: POST /api/campaigns -->
          <rect
            x="108"
            y="184"
            width="120"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="108"
            y="184"
            width="120"
            height="80"
            rx="6"
            fill="#ffffff"
            stroke="#2d3142"
            stroke-width="1"
          />
          <rect
            x="116"
            y="192"
            width="28"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(45,49,66,0.4)"
            stroke-width="0.8"
          />
          <text
            x="130"
            y="201"
            font-family="monospace"
            font-size="7"
            fill="rgba(45,49,66,0.8)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >API</text>
          <text
            x="168"
            y="232"
            font-family="sans-serif"
            font-size="11"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >POST /campaigns</text>
          <text
            x="168"
            y="246"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >status: draft</text>

          <!-- API Node B: PUT /api/campaigns/[id] -->
          <rect
            x="252"
            y="184"
            width="136"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="252"
            y="184"
            width="136"
            height="80"
            rx="6"
            fill="#ffffff"
            stroke="#2d3142"
            stroke-width="1"
          />
          <rect
            x="260"
            y="192"
            width="28"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(45,49,66,0.4)"
            stroke-width="0.8"
          />
          <text
            x="274"
            y="201"
            font-family="monospace"
            font-size="7"
            fill="rgba(45,49,66,0.8)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >API</text>
          <text
            x="320"
            y="230"
            font-family="sans-serif"
            font-size="11"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >PUT /campaigns/:id</text>
          <text
            x="320"
            y="244"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >patch wizard steps</text>
          <text
            x="320"
            y="256"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >→ Postgres</text>

          <!-- API Node C: POST /upload -->
          <rect
            x="412"
            y="184"
            width="120"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="412"
            y="184"
            width="120"
            height="80"
            rx="6"
            fill="#ffffff"
            stroke="#2d3142"
            stroke-width="1"
          />
          <rect
            x="420"
            y="192"
            width="28"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(45,49,66,0.4)"
            stroke-width="0.8"
          />
          <text
            x="434"
            y="201"
            font-family="monospace"
            font-size="7"
            fill="rgba(45,49,66,0.8)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >API</text>
          <text
            x="472"
            y="230"
            font-family="sans-serif"
            font-size="11"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >POST /upload</text>
          <text
            x="472"
            y="244"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >→ S3 Storage</text>

          <!-- API Node D: PATCH /status → KV Sync -->
          <rect
            x="556"
            y="184"
            width="136"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="556"
            y="184"
            width="136"
            height="80"
            rx="6"
            fill="rgba(235,108,54,0.08)"
            stroke="#eb6c36"
            stroke-width="1.2"
          />
          <rect
            x="564"
            y="192"
            width="28"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(235,108,54,0.5)"
            stroke-width="0.8"
          />
          <text
            x="578"
            y="201"
            font-family="monospace"
            font-size="7"
            fill="rgba(235,108,54,0.9)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >API</text>
          <text
            x="624"
            y="228"
            font-family="sans-serif"
            font-size="11"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >PATCH /status</text>
          <text
            x="624"
            y="242"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >status → active</text>
          <text
            x="624"
            y="256"
            font-family="monospace"
            font-size="8"
            fill="#eb6c36"
            text-anchor="middle"
          >→ trigger KV sync</text>

          <!-- API arrows (horizontal) -->
          <line
            x1="228"
            y1="224"
            x2="250"
            y2="224"
            stroke="#4f5d75"
            stroke-width="1.2"
            marker-end="url(#arrow)"
          />
          <line
            x1="388"
            y1="224"
            x2="410"
            y2="224"
            stroke="#4f5d75"
            stroke-width="1.2"
            marker-end="url(#arrow)"
          />
          <line
            x1="532"
            y1="224"
            x2="554"
            y2="224"
            stroke="#4f5d75"
            stroke-width="1.2"
            marker-end="url(#arrow)"
          />

          <!-- Vertical handoff arrows: Marketer → API -->
          <line
            x1="168"
            y1="144"
            x2="168"
            y2="182"
            stroke="#4f5d75"
            stroke-width="1"
            stroke-dasharray="4,3"
            marker-end="url(#arrow)"
          />
          <line
            x1="320"
            y1="144"
            x2="320"
            y2="182"
            stroke="#4f5d75"
            stroke-width="1"
            stroke-dasharray="4,3"
            marker-end="url(#arrow)"
          />
          <line
            x1="472"
            y1="144"
            x2="472"
            y2="182"
            stroke="#4f5d75"
            stroke-width="1"
            stroke-dasharray="4,3"
            marker-end="url(#arrow)"
          />
          <line
            x1="616"
            y1="144"
            x2="616"
            y2="182"
            stroke="#eb6c36"
            stroke-width="1.2"
            marker-end="url(#arrow-accent)"
          />

          <!-- KV Store node -->
          <rect
            x="556"
            y="300"
            width="136"
            height="68"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="556"
            y="300"
            width="136"
            height="68"
            rx="6"
            fill="rgba(45,49,66,0.05)"
            stroke="#4f5d75"
            stroke-width="1"
          />
          <rect
            x="564"
            y="308"
            width="28"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(79,93,117,0.5)"
            stroke-width="0.8"
          />
          <text
            x="578"
            y="317"
            font-family="monospace"
            font-size="7"
            fill="rgba(79,93,117,0.9)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >KV</text>
          <text
            x="624"
            y="342"
            font-family="sans-serif"
            font-size="12"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >Campaign Store</text>
          <text
            x="624"
            y="357"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >tenant:{id}:campaigns</text>

          <!-- PATCH /status → KV write -->
          <line
            x1="624"
            y1="264"
            x2="624"
            y2="298"
            stroke="#eb6c36"
            stroke-width="1.2"
            marker-end="url(#arrow-accent)"
          />
          <rect
            x="594"
            y="274"
            width="60"
            height="12"
            rx="2"
            fill="#f5f5f5"
          />
          <text
            x="624"
            y="283"
            font-family="monospace"
            font-size="8"
            fill="#7a8399"
            text-anchor="middle"
            letter-spacing="0.06em"
          >KV WRITE</text>

          <!-- Edge worker node: KV Read -->
          <rect
            x="556"
            y="400"
            width="136"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="556"
            y="400"
            width="136"
            height="80"
            rx="6"
            fill="#ffffff"
            stroke="#2d3142"
            stroke-width="1"
          />
          <rect
            x="564"
            y="408"
            width="36"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(45,49,66,0.4)"
            stroke-width="0.8"
          />
          <text
            x="582"
            y="417"
            font-family="monospace"
            font-size="7"
            fill="rgba(45,49,66,0.8)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >WORKER</text>
          <text
            x="624"
            y="448"
            font-family="sans-serif"
            font-size="12"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >Edge Worker</text>
          <text
            x="624"
            y="462"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >read KV · eval rules</text>
          <text
            x="624"
            y="474"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >inject campaign HTML</text>

          <!-- KV → Edge Worker (read) -->
          <line
            x1="624"
            y1="368"
            x2="624"
            y2="398"
            stroke="#2e5aa8"
            stroke-width="1.2"
            marker-end="url(#arrow-link)"
          />
          <rect
            x="594"
            y="376"
            width="60"
            height="12"
            rx="2"
            fill="#f5f5f5"
          />
          <text
            x="624"
            y="385"
            font-family="monospace"
            font-size="8"
            fill="#7a8399"
            text-anchor="middle"
            letter-spacing="0.06em"
          >KV READ</text>

          <!-- Targeting rule evaluation node -->
          <rect
            x="720"
            y="400"
            width="140"
            height="80"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="720"
            y="400"
            width="140"
            height="80"
            rx="6"
            fill="#ffffff"
            stroke="#2d3142"
            stroke-width="1"
          />
          <rect
            x="728"
            y="408"
            width="36"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(45,49,66,0.4)"
            stroke-width="0.8"
          />
          <text
            x="746"
            y="417"
            font-family="monospace"
            font-size="7"
            fill="rgba(45,49,66,0.8)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >EVAL</text>
          <text
            x="790"
            y="444"
            font-family="sans-serif"
            font-size="12"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >Targeting Rules</text>
          <text
            x="790"
            y="458"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >geo · device · page</text>
          <text
            x="790"
            y="472"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >login · GTM attrs</text>

          <!-- Edge Worker → Targeting Rules -->
          <line
            x1="692"
            y1="440"
            x2="718"
            y2="440"
            stroke="#4f5d75"
            stroke-width="1.2"
            marker-end="url(#arrow)"
          />

          <!-- Target website node -->
          <rect
            x="720"
            y="516"
            width="140"
            height="56"
            rx="6"
            fill="#f5f5f5"
          />
          <rect
            x="720"
            y="516"
            width="140"
            height="56"
            rx="6"
            fill="rgba(235,108,54,0.08)"
            stroke="#eb6c36"
            stroke-width="1.2"
          />
          <rect
            x="728"
            y="524"
            width="44"
            height="12"
            rx="2"
            fill="transparent"
            stroke="rgba(235,108,54,0.5)"
            stroke-width="0.8"
          />
          <text
            x="750"
            y="533"
            font-family="monospace"
            font-size="7"
            fill="rgba(235,108,54,0.9)"
            text-anchor="middle"
            letter-spacing="0.08em"
          >TARGET</text>
          <text
            x="790"
            y="552"
            font-family="sans-serif"
            font-size="12"
            font-weight="600"
            fill="#2d3142"
            text-anchor="middle"
          >Visitor's Browser</text>
          <text
            x="790"
            y="564"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            text-anchor="middle"
          >campaign rendered</text>

          <!-- Targeting Rules → Visitor Browser -->
          <line
            x1="790"
            y1="480"
            x2="790"
            y2="514"
            stroke="#eb6c36"
            stroke-width="1.2"
            marker-end="url(#arrow-accent)"
          />
          <rect
            x="754"
            y="490"
            width="72"
            height="12"
            rx="2"
            fill="#f5f5f5"
          />
          <text
            x="790"
            y="499"
            font-family="monospace"
            font-size="8"
            fill="#7a8399"
            text-anchor="middle"
            letter-spacing="0.06em"
          >INJECT HTML</text>

          <!-- LEGEND -->
          <line
            x1="108"
            y1="596"
            x2="1012"
            y2="596"
            stroke="rgba(45,49,66,0.10)"
            stroke-width="0.8"
          />
          <text
            x="108"
            y="610"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
            letter-spacing="0.14em"
          >LEGEND</text>
          <rect
            x="180"
            y="601"
            width="12"
            height="12"
            rx="2"
            fill="rgba(235,108,54,0.08)"
            stroke="#eb6c36"
            stroke-width="1"
          />
          <text
            x="196"
            y="611"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
          >KEY HANDOFF</text>
          <rect
            x="312"
            y="601"
            width="12"
            height="12"
            rx="2"
            fill="#ffffff"
            stroke="#2d3142"
            stroke-width="1"
          />
          <text
            x="328"
            y="611"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
          >API / WORKER</text>
          <rect
            x="444"
            y="601"
            width="12"
            height="12"
            rx="2"
            fill="rgba(45,49,66,0.05)"
            stroke="#4f5d75"
            stroke-width="1"
          />
          <text
            x="460"
            y="611"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
          >STORE</text>
          <line
            x1="548"
            y1="607"
            x2="572"
            y2="607"
            stroke="#2e5aa8"
            stroke-width="1.2"
            marker-end="url(#arrow-link)"
          />
          <text
            x="576"
            y="611"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
          >KV READ</text>
          <line
            x1="660"
            y1="607"
            x2="684"
            y2="607"
            stroke="#eb6c36"
            stroke-width="1.2"
            marker-end="url(#arrow-accent)"
          />
          <text
            x="688"
            y="611"
            font-family="monospace"
            font-size="8"
            fill="#4f5d75"
          >ACTIVATION / INJECT</text>
        </svg>
      </div>

      <div class="cards">
        <div class="card">
          <p class="card-eyebrow">
            CAMPAIGN STUDIO
          </p>
          <div class="card-header">
            <span class="card-dot coral" />
            <h3>oasis-proto</h3>
          </div>
          <ul>
            <li>5-step wizard: template → target → trigger → goal → launch</li>
            <li>Targeting rules: geo, device, page URL, login state, GTM attrs</li>
            <li>Creative assets stored in S3 compatible storage</li>
            <li>Status transitions: draft → scheduled → active → paused → completed</li>
          </ul>
        </div>

        <div class="card">
          <p class="card-eyebrow">
            EDGE DELIVERY
          </p>
          <div class="card-header">
            <span class="card-dot ink" />
            <h3>oasis-edge + KV</h3>
          </div>
          <ul>
            <li>KV sync fires on every status change to active/paused/completed</li>
            <li>Key: <code class="mono-text">tenant:{id}:campaigns</code></li>
            <li>Edge worker reads KV, evaluates targeting rules per request</li>
            <li>Injects campaign HTML into matching page responses</li>
          </ul>
        </div>

        <div class="card">
          <p class="card-eyebrow">
            TRIGGER MODES
          </p>
          <div class="card-header">
            <span class="card-dot muted" />
            <h3>Delivery Triggers</h3>
          </div>
          <ul>
            <li>Immediate — on page load</li>
            <li>Scroll — at depth threshold</li>
            <li>Exit intent — on cursor leave</li>
            <li>Test mode flag for safe preview</li>
          </ul>
        </div>
      </div>

      <footer>
        OASIS PLATFORM · CAMPAIGN LIFECYCLE · oasis-proto → Cloudflare KV → oasis-edge → visitor browser
      </footer>
    </div>
  </div>
</template>

<style scoped>
.workflow-container {
  background: #f5f5f5;
  min-height: 100%;
  padding: 48px 40px 64px;
  color: #2d3142;
}

.content-wrap {
  max-width: 1120px;
  margin: 0 auto;
}

.eyebrow {
  font-family: monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #7a8399;
  margin-bottom: 12px;
}

h1 {
  font-size: 1.75rem;
  font-weight: 400;
  color: #2d3142;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #4f5d75;
  margin-bottom: 40px;
}

.diagram-wrap {
  overflow-x: auto;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(45, 49, 66, 0.1);
}

svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 40px;
}

.card {
  background: #ffffff;
  border: 1px solid rgba(45, 49, 66, 0.12);
  border-radius: 6px;
  padding: 20px;
}

.card-eyebrow {
  font-family: monospace;
  font-size: 8px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #7a8399;
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.card-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.card-dot.coral { background: #eb6c36; }
.card-dot.ink   { background: #2d3142; }
.card-dot.muted { background: #4f5d75; }

.card h3 {
  font-size: 13px;
  font-weight: 600;
  color: #2d3142;
}

.card ul {
  list-style: none;
  padding: 0;
}

.card ul li {
  font-size: 12px;
  color: #4f5d75;
  padding: 6px 0;
  border-bottom: 1px solid rgba(45, 49, 66, 0.06);
  line-height: 1.4;
}

.card ul li:last-child { border-bottom: none; }

.mono-text {
  font-family: monospace;
  font-size: 11px;
}

footer {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid rgba(45, 49, 66, 0.12);
  font-family: monospace;
  font-size: 9px;
  color: #7a8399;
  letter-spacing: 0.08em;
}

/* cyrillic */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwYGFWNOITddY4.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwSGFWNOITddY4.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwcGFWNOITd.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwYGFWNOITddY4.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwSGFWNOITddY4.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwcGFWNOITd.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwYGFWNOITddY4.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwSGFWNOITddY4.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Geist';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geist/v4/gyByhwUxId8gMEwcGFWNOITd.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrMdmhHkjkotbA.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrkdmhHkjkotbA.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrMdmhHkjkotbA.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrkdmhHkjkotbA.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* cyrillic */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrMdmhHkjkotbA.woff2) format('woff2');
  unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
}
/* latin-ext */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrkdmhHkjkotbA.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Geist Mono';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/geistmono/v4/or3nQ6H-1_WfwkMZI_qYFrcdmhHkjko.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin-ext */
@font-face {
  font-family: 'Instrument Serif';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjgn7Motmp5r61.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Instrument Serif';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/instrumentserif/v5/jizHRFtNs2ka5fXjeivQ4LroWlx-6zAjjH7Motmp5g.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
/* latin-ext */
@font-face {
  font-family: 'Instrument Serif';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zsTjnTLgNuZ5w.woff2) format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
/* latin */
@font-face {
  font-family: 'Instrument Serif';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjnTLgNs.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

code{
  font-family:"Geist Mono",monospace;
  font-size:11px;
}
</style>
