#!/usr/bin/env python3
"""
Builds all 10 crisp 640x640 transparent dark-ink coloring book pages for Zoo Coloring:
  - 7 published-style illustrated full-scene pages:
      lion, elephant, whale, penguin, giraffe, gorilla (Whit), panda
  - 3 hand-crafted studio storybook Bezier coloring pages traced directly from
      our original watercolor characters with lush scenery:
      monkey, frog, turtle (with 6 rainbow shell scute panels!)

Outputs:
  - assets/images/coloring-<id>.png (transparent #3E2B1C ink line art, optipng-optimized)
  - scratch preview sheets verifying crispness & flood-fill region segmentation
"""
import os
import subprocess
from collections import deque
from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

ROOT = "/home/antigravity/tgrantw/whits-world"
ART_DIR = "/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p_devbox/740bf88d-5a57-43c1-9d8a-d60c09054960"
OUT_IMG_DIR = os.path.join(ROOT, "assets", "images")
SCRATCH_DIR = os.path.join(ART_DIR, "scratch")
os.makedirs(SCRATCH_DIR, exist_ok=True)

SIZE = 640
INK_RGB = (62, 43, 28)  # Warm storybook dark brown ink (#3E2B1C)

GENERATED_PAGES = {
    "lion": os.path.join(ART_DIR, "coloring_lion_v2_1795900163467.jpg"),
    "elephant": os.path.join(ART_DIR, "coloring_elephant_1795900136741.jpg"),
    "whale": os.path.join(ART_DIR, "coloring_whale_1795900138864.jpg"),
    "penguin": os.path.join(ART_DIR, "coloring_penguin_1795900166028.jpg"),
    "giraffe": os.path.join(ART_DIR, "coloring_giraffe_1795900140272.jpg"),
    "gorilla": os.path.join(ART_DIR, "coloring_gorilla_1795900879694.jpg"),
    "panda": os.path.join(ART_DIR, "coloring_panda_1795900899846.jpg"),
}

# Hand-crafted studio storybook coloring pages (matching the exact ~5.5px warm ink line art
# & charming storybook details of the 7 illustrated pages above, rendered at 2x and downsampled!)
VECTOR_STORYBOOK_PAGES = {
    "monkey": """
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
      <rect width="640" height="640" fill="#FFFFFF"/>

      <!-- Puffy Storybook Cloud (top-left) -->
      <path d="M 64 114 C 42 114 32 98 38 82 C 44 68 62 64 74 70 C 86 44 122 38 146 54 C 162 46 184 54 192 70 C 214 70 226 88 220 106 C 215 118 200 120 184 118 C 160 122 94 122 64 114 Z"
            fill="#FFF" stroke="#000" stroke-width="5.5" stroke-linejoin="round"/>

      <!-- Cheerful Smiling Sun with Teardrop Rays (top-right) -->
      <g stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="#FFF" transform="translate(534, 102)">
        <path d="M 0 -72 C -5 -58 5 -58 0 -72 Z M 0 -72 Q -6 -60 0 -52 Q 6 -60 0 -72 Z"/>
        <path d="M 0 72 Q -6 60 0 52 Q 6 60 0 72 Z"/>
        <path d="M -72 0 Q -60 -6 -52 0 Q -60 6 -72 0 Z"/>
        <path d="M 72 0 Q 60 -6 52 0 Q 60 6 72 0 Z"/>
        <path d="M -51 -51 Q -46 -39 -37 -37 Q -39 -46 -51 -51 Z"/>
        <path d="M 51 51 Q 46 39 37 37 Q 39 46 51 51 Z"/>
        <path d="M 51 -51 Q 39 -46 37 -37 Q 46 -39 51 -51 Z"/>
        <path d="M -51 51 Q -39 46 -37 37 Q -46 39 -51 51 Z"/>
        <circle cx="0" cy="0" r="42" stroke-width="5.5"/>
        <circle cx="-14" cy="-5" r="4.5" fill="#000"/>
        <circle cx="14" cy="-5" r="4.5" fill="#000"/>
        <ellipse cx="-24" cy="4" rx="6" ry="4" stroke-width="3"/>
        <ellipse cx="24" cy="4" rx="6" ry="4" stroke-width="3"/>
        <path d="M -11 8 Q 0 20 11 8" fill="none" stroke-width="4.5"/>
      </g>

      <!-- Tropical Palm & Leafy Jungle Branch (left side) -->
      <g stroke="#000" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round" fill="#FFF">
        <path d="M -10 218 Q 74 204 150 226 Q 94 234 -10 248 Z"/>
        <path d="M 56 238 C 30 264 34 302 68 318 C 94 290 90 254 60 238 Z"/>
        <path d="M 60 242 Q 66 276 68 308" fill="none" stroke-width="3.5"/>
        <path d="M 116 230 C 102 260 114 290 146 296 C 162 268 148 238 120 230 Z"/>
        <path d="M 122 234 Q 134 260 142 288" fill="none" stroke-width="3.5"/>
      </g>

      <!-- Lush Jungle Ferns & Bushes (far right background) -->
      <g stroke="#000" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round" fill="#FFF">
        <path d="M 648 486 C 632 454 596 446 574 464 C 556 444 522 450 510 478 L 648 494 Z"/>
        <path d="M 588 468 C 618 416 610 354 558 332 C 534 384 544 438 584 468 Z"/>
        <path d="M 584 464 Q 574 402 560 348" fill="none" stroke-width="3.8"/>
      </g>

      <!-- Rolling Grassy Clearing -->
      <path d="M -10 516 Q 160 478 330 492 Q 490 506 650 474 L 650 650 L -10 650 Z"
            fill="#FFF" stroke="#000" stroke-width="5.5" stroke-linejoin="round"/>
      <!-- Grass Tufts -->
      <g stroke="#000" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M 38 552 l 5 -16 l 6 14 l 7 -18 l 6 18"/>
        <path d="M 218 564 l 4 -12 l 6 11 l 6 -14 l 5 14"/>
        <path d="M 442 548 l 5 -13 l 5 11 l 6 -15 l 5 15"/>
        <path d="M 582 590 l 5 -15 l 6 13 l 7 -17 l 6 17"/>
      </g>

      <!-- Cute Jungle Flower (bottom-left) -->
      <g stroke="#000" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" fill="#FFF" transform="translate(106, 558)">
        <path d="M 0 18 Q -2 40 0 60" fill="none" stroke-width="5.5"/>
        <path d="M -2 46 C -22 36 -30 48 -14 56 Z"/>
        <path d="M 2 44 C 22 34 30 46 14 54 Z"/>
        <circle cx="0" cy="-19" r="12"/>
        <circle cx="18" cy="-6" r="12"/>
        <circle cx="11" cy="15" r="12"/>
        <circle cx="-11" cy="15" r="12"/>
        <circle cx="-18" cy="-6" r="12"/>
        <circle cx="0" cy="0" r="11"/>
      </g>

      <!-- Bunch of 3 Ripe Bananas (bottom-right) -->
      <g stroke="#000" stroke-width="5.2" stroke-linejoin="round" stroke-linecap="round" fill="#FFF" transform="translate(514, 540)">
        <path d="M -52 14 C -20 44 30 34 44 -20 C 32 -24 22 -18 16 -8 C 4 12 -22 14 -52 8 Z"/>
        <path d="M -32 28 C 2 52 50 38 58 -14 C 46 -18 36 -12 31 -2 C 20 18 -4 22 -32 20 Z"/>
        <path d="M -10 38 C 22 56 64 42 68 -8 C 58 -12 48 -6 44 4 C 34 22 14 28 -10 28 Z"/>
        <path d="M 38 -28 L 68 -18 L 62 -6 L 34 -16 Z"/>
      </g>

      <!-- ===== PLAYFUL MONKEY (traced cleanly from grid_monkey.png) ===== -->
      <g transform="translate(330, 395) scale(1.14) translate(-330, -395)" stroke="#000" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="#FFF">
        <!-- Curly Spiral Tail (100% open & colorable!) -->
        <path d="M 274 440 C 200 472 138 430 144 358 C 150 296 196 274 228 296 C 250 312 248 348 224 360 C 204 370 184 356 188 338 C 190 326 202 322 210 328 C 216 332 214 342 208 342 C 218 344 226 332 220 320 C 210 302 180 308 172 344 C 164 388 194 436 268 418 Z"/>

        <!-- Waving Right Arm & Hand -->
        <path d="M 390 318 C 414 338 432 346 448 330 C 446 312 454 302 462 308 C 468 294 478 296 476 310 C 486 300 496 306 488 320 C 498 316 502 326 488 336 C 492 344 484 352 472 350 C 456 376 426 398 394 384 Z"/>
        <!-- Wrist fur cuff on waving hand -->
        <path d="M 444 332 L 452 344 L 460 338 L 466 350" fill="none" stroke-width="4.5"/>

        <!-- Legs & Cute Monkey Feet -->
        <path d="M 274 438 C 266 474 274 494 282 504 C 262 506 250 518 256 526 C 262 532 276 528 284 522 C 282 532 292 536 300 526 C 304 532 316 530 316 518 C 316 508 310 500 314 482 C 322 468 344 468 352 482 C 356 500 350 508 350 518 C 350 530 362 532 366 526 C 374 536 384 532 382 522 C 390 528 404 532 410 526 C 416 518 404 506 384 504 C 394 494 402 472 396 438 Z"/>
        <!-- Ankle fur tufts -->
        <path d="M 282 502 L 292 496 L 300 504 L 310 498" fill="none" stroke-width="4.2"/>
        <path d="M 356 498 L 366 504 L 374 496 L 384 502" fill="none" stroke-width="4.2"/>

        <!-- Monkey Torso -->
        <path d="M 282 310 C 254 342 254 424 276 462 C 296 488 370 488 392 460 C 414 422 412 342 384 310 Z"/>

        <!-- Soft Rounded Tummy Patch (cleanly closed for coloring!) -->
        <path d="M 304 334 C 326 324 356 326 374 342 C 394 366 396 426 374 452 C 354 470 318 470 300 450 C 284 428 284 366 304 334 Z"
              stroke-width="4.8"/>

        <!-- Left Arm Bent Cheerfully Across Tummy -->
        <path d="M 280 322 C 246 346 238 386 260 404 C 276 414 294 404 306 396 C 316 400 326 394 322 384 C 330 382 332 372 322 368 C 328 362 324 352 312 354 C 312 346 302 346 296 356 C 288 360 278 366 276 364 C 282 350 288 338 292 330"/>
        <!-- Cuff line separating arm fur & cute hand -->
        <path d="M 294 360 L 298 372 L 292 382 L 302 394" fill="none" stroke-width="4.2"/>

        <!-- Big Cute Monkey Ears -->
        <circle cx="246" cy="260" r="30"/>
        <path d="M 252 246 C 234 244 228 268 246 276 C 252 278 256 272 252 266" fill="none" stroke-width="4.5"/>
        <circle cx="410" cy="242" r="29"/>
        <path d="M 404 228 C 422 226 428 250 410 258 C 404 260 400 254 404 248" fill="none" stroke-width="4.5"/>

        <!-- Monkey Head + Adorable Hair Tuft -->
        <path d="M 254 248 C 248 198 280 166 314 162 C 316 146 328 142 332 154 C 340 144 352 148 348 160 C 384 166 408 198 406 244 C 406 286 376 318 332 320 C 288 320 258 292 254 248 Z"/>

        <!-- Classic Heart-Shaped Monkey Face Mask -->
        <path d="M 328 214 C 308 194 272 208 272 246 C 272 288 298 314 334 314 C 370 312 396 284 394 244 C 392 202 352 190 328 214 Z"
              stroke-width="4.8"/>

        <!-- Big Sparkling Eyes -->
        <circle cx="300" cy="246" r="14" stroke-width="4.2"/>
        <circle cx="301" cy="247" r="9.5" fill="#000" stroke="none"/>
        <circle cx="297" cy="242" r="3.6" fill="#FFF" stroke="none"/>
        <circle cx="305" cy="251" r="1.8" fill="#FFF" stroke="none"/>

        <circle cx="364" cy="240" r="14" stroke-width="4.2"/>
        <circle cx="363" cy="241" r="9.5" fill="#000" stroke="none"/>
        <circle cx="359" cy="236" r="3.6" fill="#FFF" stroke="none"/>
        <circle cx="367" cy="245" r="1.8" fill="#FFF" stroke="none"/>

        <!-- Happy Eyebrows -->
        <path d="M 288 222 Q 298 214 308 220" fill="none" stroke-width="4.5"/>
        <path d="M 352 214 Q 362 208 372 216" fill="none" stroke-width="4.5"/>

        <!-- Rosy Cheek Ovals (colorable!) -->
        <ellipse cx="288" cy="272" rx="13" ry="8" stroke-width="3.4"/>
        <ellipse cx="380" cy="264" rx="13" ry="8" stroke-width="3.4"/>

        <!-- Cute Little Monkey Nose -->
        <path d="M 322 258 C 324 252 332 252 334 256 C 338 252 346 252 348 258 C 344 266 326 266 322 258 Z" stroke-width="3.8"/>
        <circle cx="329" cy="258" r="2.2" fill="#000" stroke="none"/>
        <circle cx="341" cy="258" r="2.2" fill="#000" stroke="none"/>

        <!-- Joyful Open Smile & Little Tongue -->
        <path d="M 304 274 Q 336 294 366 270" fill="none" stroke-width="4.8"/>
        <path d="M 314 279 C 322 302 350 300 356 276" fill="#FFF" stroke-width="4.4"/>
        <path d="M 323 292 Q 336 286 348 291" fill="none" stroke-width="3.6"/>
        <path d="M 301 271 Q 304 275 308 273 M 362 269 Q 366 272 370 268" fill="none" stroke-width="3.6"/>
      </g>
    </svg>
    """,

    "frog": """
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
      <rect width="640" height="640" fill="#FFFFFF"/>

      <!-- Cheerful Smiling Sun with Teardrop Rays (top-left) -->
      <g stroke="#000" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="#FFF" transform="translate(106, 102)">
        <path d="M 0 -70 Q -6 -58 0 -50 Q 6 -58 0 -70 Z"/>
        <path d="M 0 70 Q -6 58 0 50 Q 6 58 0 70 Z"/>
        <path d="M -70 0 Q -58 -6 -50 0 Q -58 6 -70 0 Z"/>
        <path d="M 70 0 Q 58 -6 50 0 Q 58 6 70 0 Z"/>
        <path d="M -49 -49 Q -44 -38 -35 -35 Q -38 -44 -49 -49 Z"/>
        <path d="M 49 49 Q 44 38 35 35 Q 38 44 49 49 Z"/>
        <path d="M 49 -49 Q 38 -44 35 -35 Q 44 -38 49 -49 Z"/>
        <path d="M -49 49 Q -38 44 -35 35 Q -44 38 -49 49 Z"/>
        <circle cx="0" cy="0" r="41" stroke-width="5.5"/>
        <path d="M -18 -5 Q -12 -13 -6 -5" fill="none" stroke-width="4.5"/>
        <path d="M 6 -5 Q 12 -13 18 -5" fill="none" stroke-width="4.5"/>
        <ellipse cx="-22" cy="5" rx="6" ry="3.8" stroke-width="3"/>
        <ellipse cx="22" cy="5" rx="6" ry="3.8" stroke-width="3"/>
        <path d="M -11 8 Q 0 19 11 8" fill="none" stroke-width="4.5"/>
      </g>

      <!-- Puffy Storybook Cloud (top-right) -->
      <path d="M 434 116 C 412 116 402 100 408 84 C 414 70 432 66 444 72 C 456 46 492 40 516 56 C 532 48 554 56 562 72 C 584 72 596 90 590 108 C 585 120 570 122 554 120 C 530 124 464 124 434 116 Z"
            fill="#FFF" stroke="#000" stroke-width="5.5" stroke-linejoin="round"/>

      <!-- Cute Fluttering Dragonfly (upper-right sky) -->
      <g stroke="#000" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round" fill="#FFF" transform="translate(534, 224) rotate(-14)">
        <ellipse cx="-24" cy="-14" rx="22" ry="9" transform="rotate(-14 -24 -14)"/>
        <ellipse cx="24" cy="-14" rx="22" ry="9" transform="rotate(14 24 -14)"/>
        <ellipse cx="-20" cy="4" rx="18" ry="7.5" transform="rotate(12 -20 4)"/>
        <ellipse cx="20" cy="4" rx="18" ry="7.5" transform="rotate(-12 20 4)"/>
        <path d="M -4 -18 C -4 -26 4 -26 4 -18 L 3 28 C 3 34 -3 34 -3 28 Z"/>
        <circle cx="0" cy="-22" r="8.5"/>
        <circle cx="-3" cy="-23" r="2" fill="#000" stroke="none"/>
        <circle cx="3" cy="-23" r="2" fill="#000" stroke="none"/>
        <path d="M -4 -30 Q -10 -38 -15 -37 M 4 -30 Q 10 -38 15 -37" fill="none" stroke-width="3.6"/>
      </g>

      <!-- Calm Pond Water Horizon -->
      <path d="M -10 426 Q 160 400 320 416 Q 480 432 650 408 L 650 650 L -10 650 Z"
            fill="#FFF" stroke="#000" stroke-width="5.5"/>
      <!-- Water Ripples -->
      <path d="M 28 588 Q 78 574 128 588 M 478 594 Q 538 580 598 594 M 26 480 Q 64 472 96 480"
            fill="none" stroke="#000" stroke-width="4.5" stroke-linecap="round"/>

      <!-- Pond Cattails & Tall Reeds (left side) -->
      <g stroke="#000" stroke-width="5.2" stroke-linejoin="round" stroke-linecap="round" fill="#FFF">
        <path d="M 68 430 Q 64 352 68 272" fill="none" stroke-width="5.8"/>
        <rect x="55" y="246" width="24" height="62" rx="12"/>
        <path d="M 67 246 L 67 228" fill="none" stroke-width="4.5"/>
        <path d="M 116 426 Q 124 366 130 314" fill="none" stroke-width="5.2"/>
        <rect x="119" y="294" width="20" height="48" rx="10"/>
        <path d="M 66 430 C 44 384 26 346 18 308 C 44 342 58 380 72 428 Z"/>
        <path d="M 74 428 C 92 384 106 356 120 330 C 102 366 94 394 84 428 Z"/>
        <path d="M 114 426 C 132 390 148 366 164 346 C 146 382 136 404 126 426 Z"/>
      </g>

      <!-- Giant Notched Lily Pad -->
      <path d="M 320 532 L 424 584 C 392 598 356 606 320 606 C 188 606 94 562 94 510 C 94 458 188 416 320 416 C 452 416 544 458 544 510 C 544 532 522 552 486 568 Z"
            fill="#FFF" stroke="#000" stroke-width="5.8" stroke-linejoin="round"/>
      <!-- Lily pad subtle veins -->
      <path d="M 148 518 Q 204 516 244 518 M 462 512 Q 492 514 516 520" fill="none" stroke="#000" stroke-width="3.8" stroke-linecap="round"/>

      <!-- Pretty Blooming Multi-Petal Lotus Flower (right pond) -->
      <g stroke="#000" stroke-width="5" stroke-linejoin="round" fill="#FFF" transform="translate(534, 494)">
        <path d="M -52 14 C -36 -4 -14 -4 -2 10 C -18 22 -38 22 -52 14 Z"/>
        <path d="M 52 14 C 36 -4 14 -4 2 10 C 18 22 38 22 52 14 Z"/>
        <path d="M -38 6 C -42 -20 -20 -32 -4 -10 C -14 10 -28 12 -38 6 Z"/>
        <path d="M 38 6 C 42 -20 20 -32 4 -10 C 14 10 28 12 38 6 Z"/>
        <path d="M -18 4 C -24 -24 -8 -42 0 -46 C 8 -42 24 -24 18 4 C 10 14 -10 14 -18 4 Z"/>
        <ellipse cx="0" cy="14" rx="34" ry="8"/>
      </g>

      <!-- ===== BOUNCY FROG (traced cleanly from grid_frog.png) ===== -->
      <g transform="translate(320, 385) scale(1.12) translate(-320, -385)" stroke="#000" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="#FFF">
        <!-- Chubby Folded Hind Thighs & Webbed Back Feet -->
        <path d="M 244 374 C 192 368 164 404 176 446 C 184 470 208 486 232 492 L 244 456 Z"/>
        <path d="M 396 374 C 448 368 476 404 464 446 C 456 470 432 486 408 492 L 396 456 Z"/>
        <!-- Hind inner crease -->
        <path d="M 198 416 Q 214 432 222 458 M 442 416 Q 426 432 418 458" fill="none" stroke-width="4.2"/>

        <!-- Back Webbed Toes (left & right) -->
        <path d="M 216 486 C 194 480 174 478 168 488 C 164 496 176 502 190 498 C 180 508 188 518 202 510 C 204 520 218 518 224 504 Z"/>
        <path d="M 424 486 C 446 480 466 478 472 488 C 476 496 464 502 450 498 C 460 508 452 518 438 510 C 436 520 422 518 416 504 Z"/>

        <!-- Frog Round Body -->
        <path d="M 234 304 C 214 358 216 438 248 472 C 276 498 364 498 392 472 C 424 438 426 358 406 304 Z"/>

        <!-- Smooth Cream Belly Oval (100% closed & colorable!) -->
        <ellipse cx="320" cy="404" rx="64" ry="74" stroke-width="4.8"/>

        <!-- Front Frog Arms & Cute Spread 4-Toed Hands -->
        <path d="M 244 334 C 228 384 236 436 254 478 C 236 482 228 494 238 502 C 246 506 254 498 258 492 C 254 508 264 516 274 506 C 278 518 292 514 292 498 C 296 504 308 498 304 486 C 298 476 286 474 282 472 C 270 434 264 388 266 346"/>
        <path d="M 396 334 C 412 384 404 436 386 478 C 404 482 412 494 402 502 C 394 506 386 498 382 492 C 386 508 376 516 366 506 C 362 518 348 514 348 498 C 344 504 332 498 336 486 C 342 476 354 474 358 472 C 370 434 376 388 374 346"/>

        <!-- Big Adorable Frog Head with High Eye Domes -->
        <path d="M 220 242 C 208 200 232 168 262 170 C 282 172 294 184 298 196 Q 320 192 342 196 C 346 184 358 172 378 170 C 408 168 432 200 420 242 C 440 264 434 304 404 322 C 374 340 266 340 236 322 C 206 304 200 264 220 242 Z"/>

        <!-- Soft Cream Chin Separation Line (below big smile, makes upper green face & cream throat colorable separately!) -->
        <path d="M 224 276 Q 320 318 416 276" fill="none" stroke-width="4.2"/>

        <!-- Huge Joyful Frog Eyes -->
        <circle cx="260" cy="214" r="28" stroke-width="4.8"/>
        <circle cx="262" cy="215" r="18" fill="#000" stroke="none"/>
        <circle cx="254" cy="207" r="6.5" fill="#FFF" stroke="none"/>
        <circle cx="269" cy="222" r="3" fill="#FFF" stroke="none"/>

        <circle cx="380" cy="214" r="28" stroke-width="4.8"/>
        <circle cx="378" cy="215" r="18" fill="#000" stroke="none"/>
        <circle cx="370" cy="207" r="6.5" fill="#FFF" stroke="none"/>
        <circle cx="385" cy="222" r="3" fill="#FFF" stroke="none"/>

        <!-- Cute Rosy Frog Cheeks (colorable!) -->
        <ellipse cx="234" cy="260" rx="15" ry="10" stroke-width="3.4"/>
        <ellipse cx="406" cy="260" rx="15" ry="10" stroke-width="3.4"/>

        <!-- Cute Tiny Nostrils -->
        <ellipse cx="304" cy="244" rx="4.5" ry="3.2" fill="#000" stroke="none"/>
        <ellipse cx="336" cy="244" rx="4.5" ry="3.2" fill="#000" stroke="none"/>

        <!-- Giant Happy Frog Smile -->
        <path d="M 244 268 Q 320 304 396 268" fill="none" stroke-width="5.2"/>
        <path d="M 239 264 Q 245 268 250 265 M 390 265 Q 395 268 401 264" fill="none" stroke-width="4"/>
      </g>
    </svg>
    """,

    "turtle": """
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
      <rect width="640" height="640" fill="#FFFFFF"/>

      <!-- Gentle Ocean Surface Waves (top sky zone with sun & cloud!) -->
      <path d="M -10 132 Q 54 110 118 132 T 246 132 T 374 132 T 502 132 T 650 132"
            fill="none" stroke="#000" stroke-width="5.5" stroke-linecap="round"/>

      <!-- Puffy Cloud (top-left sky) -->
      <path d="M 68 92 C 50 92 42 78 48 66 C 54 54 68 50 78 56 C 88 36 118 30 138 44 C 152 38 172 44 178 58 C 196 58 206 72 200 86 C 196 96 184 98 170 96 C 148 100 94 100 68 92 Z"
            fill="#FFF" stroke="#000" stroke-width="5" stroke-linejoin="round"/>

      <!-- Smiling Sun (top-right sky) -->
      <g stroke="#000" stroke-width="4.8" stroke-linecap="round" stroke-linejoin="round" fill="#FFF" transform="translate(546, 68)">
        <line x1="0" y1="-54" x2="0" y2="-40"/>
        <line x1="-54" y1="0" x2="-40" y2="0"/>
        <line x1="40" y1="0" x2="54" y2="0"/>
        <line x1="-38" y1="-38" x2="-28" y2="-28"/>
        <line x1="38" y1="-38" x2="28" y2="-28"/>
        <line x1="-38" y1="34" x2="-28" y2="26"/>
        <line x1="38" y1="34" x2="28" y2="26"/>
        <circle cx="0" cy="0" r="32" stroke-width="5.2"/>
        <circle cx="-10" cy="-4" r="3.6" fill="#000" stroke="none"/>
        <circle cx="10" cy="-4" r="3.6" fill="#000" stroke="none"/>
        <path d="M -9 6 Q 0 14 9 6" fill="none" stroke-width="4"/>
      </g>

      <!-- Glossy Underwater Bubbles -->
      <g stroke="#000" stroke-width="5" fill="#FFF">
        <circle cx="104" cy="212" r="28"/>
        <path d="M 90 202 Q 96 192 108 194" fill="none" stroke-width="3.8" stroke-linecap="round"/>
        <circle cx="158" cy="176" r="16"/>
        <circle cx="80" cy="272" r="14"/>
        <circle cx="556" cy="210" r="24"/>
        <path d="M 544 202 Q 550 194 560 195" fill="none" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="586" cy="264" r="14"/>
      </g>

      <!-- Curving Sandy Ocean Floor -->
      <path d="M -10 534 Q 160 498 320 520 Q 480 542 650 510 L 650 650 L -10 650 Z"
            fill="#FFF" stroke="#000" stroke-width="5.5"/>

      <!-- Swaying Kelp Seaweed Fronds (left & right) -->
      <g stroke="#000" stroke-width="5.2" stroke-linejoin="round" fill="#FFF">
        <path d="M 48 532 C 18 470 64 416 38 344 C 72 376 86 438 70 530 Z"/>
        <path d="M 88 528 C 68 480 104 440 88 394 C 114 422 118 470 106 526 Z"/>
        <path d="M 588 524 C 618 460 572 406 598 336 C 562 370 548 432 564 522 Z"/>
        <path d="M 546 526 C 564 482 532 444 546 402 C 520 428 518 474 530 526 Z"/>
      </g>

      <!-- Cute Smiling Sea Starfish (bottom-right) -->
      <g stroke="#000" stroke-width="5.2" stroke-linejoin="round" fill="#FFF" transform="translate(526, 568) rotate(-8)">
        <path d="M 0 -46 L 13 -14 L 46 -10 L 21 13 L 28 45 L 0 28 L -28 45 L -21 13 L -46 -10 L -13 -14 Z"/>
        <circle cx="-10" cy="-2" r="3.8" fill="#000" stroke="none"/>
        <circle cx="10" cy="-2" r="3.8" fill="#000" stroke="none"/>
        <path d="M -8 9 Q 0 16 8 9" fill="none" stroke-width="4" stroke-linecap="round"/>
      </g>

      <!-- Cute Striped Little Baby Fish (bottom-left) -->
      <g stroke="#000" stroke-width="5" stroke-linejoin="round" fill="#FFF" transform="translate(132, 574)">
        <path d="M -30 0 L -54 -20 Q -46 0 -54 20 Z"/>
        <path d="M -30 0 C -18 -26 24 -26 46 0 C 24 26 -18 26 -30 0 Z"/>
        <path d="M -12 -18 Q -4 0 -12 18 M 4 -20 Q 12 0 4 20" fill="none" stroke-width="4.2"/>
        <circle cx="24" cy="-4" r="4.2" fill="#000" stroke="none"/>
        <path d="M 28 7 Q 34 11 40 6" fill="none" stroke-width="3.8" stroke-linecap="round"/>
      </g>

      <!-- ===== RAINBOW TURTLE (traced cleanly from grid_turtle.png) ===== -->
      <g transform="translate(330, 365) scale(1.10) translate(-330, -365)" stroke="#000" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" fill="#FFF">
        <!-- Back Swimming Flippers -->
        <path d="M 196 426 C 154 434 112 464 108 492 C 106 508 136 506 164 490 C 186 476 202 456 212 438 Z"/>
        <path d="M 224 446 C 206 472 204 504 218 510 C 234 516 264 492 274 458 Z"/>

        <!-- Front Right Flipper (behind body) -->
        <path d="M 442 362 C 492 364 522 418 498 480 C 484 514 454 522 446 492 C 438 462 436 416 438 378 Z"/>

        <!-- Soft Rounded Turtle Belly Plastron (underneath shell) -->
        <path d="M 192 434 C 248 476 364 468 446 382 L 434 334 L 200 400 Z"/>
        <!-- Cute belly divider curve -->
        <path d="M 244 448 Q 318 442 396 400" fill="none" stroke-width="4.2"/>

        <!-- Big Domed Rainbow Turtle Shell (6 clean mosaic rainbow patches + scalloped skirt!) -->
        <path d="M 140 416 C 148 310 228 248 326 254 C 362 256 384 278 392 318 C 398 352 344 410 264 432 C 194 452 138 442 140 416 Z"/>

        <!-- Lower Shell Rim Border Curve (separates main dome from scalloped shell rim!) -->
        <path d="M 144 402 C 208 424 314 398 386 322" fill="none" stroke-width="5"/>
        <!-- Rim Scute Divider Ticks (5 cute rim segments!) -->
        <path d="M 186 414 L 180 436 M 234 414 L 236 438 M 286 398 L 296 420 M 338 368 L 352 384" fill="none" stroke-width="4.4"/>

        <!-- 6 BIG CLEAN RAINBOW MOSAIC HEXAGON/PENTAGON SCUTE PANELS inside the shell! -->
        <!-- Center Hexagon Scute -->
        <path d="M 224 342 L 268 302 L 320 308 L 326 352 L 278 386 L 228 380 Z" stroke-width="4.8"/>
        <!-- Connectors radiating cleanly from Center Hexagon to outer shell dome & rim! -->
        <path d="M 268 302 L 254 260" fill="none" stroke-width="4.8"/>
        <path d="M 320 308 L 344 260" fill="none" stroke-width="4.8"/>
        <path d="M 326 352 L 378 330" fill="none" stroke-width="4.8"/>
        <path d="M 278 386 L 284 400" fill="none" stroke-width="4.8"/>
        <path d="M 228 380 L 204 414" fill="none" stroke-width="4.8"/>
        <path d="M 224 342 L 160 352" fill="none" stroke-width="4.8"/>

        <!-- Front Left Flipper (prominent foreground flipper!) -->
        <path d="M 362 372 C 398 394 412 450 384 500 C 356 544 304 562 292 548 C 282 536 300 494 314 456 C 324 426 334 388 362 372 Z"/>

        <!-- Graceful Turtle Neck & Big Smiling Head -->
        <path d="M 366 348 C 344 308 346 244 380 206 C 414 170 472 170 504 202 C 534 234 538 286 508 318 C 484 344 456 350 434 368 C 418 382 390 380 366 348 Z"/>
        <!-- Subtle neck-to-head chin curve -->
        <path d="M 378 334 Q 422 356 462 344" fill="none" stroke-width="4.2"/>

        <!-- Cute Turtle Forehead Spots (optional colorable dots!) -->
        <ellipse cx="442" cy="206" rx="13" ry="9" stroke-width="3.4"/>
        <ellipse cx="414" cy="196" rx="9" ry="6" stroke-width="3.2"/>
        <ellipse cx="468" cy="204" rx="8" ry="6" stroke-width="3.2"/>

        <!-- Huge Sparkling Joyful Turtle Eyes -->
        <circle cx="404" cy="252" r="24" stroke-width="4.6"/>
        <circle cx="407" cy="253" r="15.5" fill="#000" stroke="none"/>
        <circle cx="401" cy="246" r="5.5" fill="#FFF" stroke="none"/>
        <circle cx="414" cy="259" r="2.6" fill="#FFF" stroke="none"/>

        <circle cx="496" cy="238" r="21" stroke-width="4.6"/>
        <circle cx="494" cy="239" r="13.5" fill="#000" stroke="none"/>
        <circle cx="489" cy="233" r="4.8" fill="#FFF" stroke="none"/>
        <circle cx="500" cy="244" r="2.3" fill="#FFF" stroke="none"/>

        <!-- Happy Arched Eyebrows -->
        <path d="M 386 220 Q 398 210 412 214" fill="none" stroke-width="4.5"/>
        <path d="M 484 208 Q 496 204 506 212" fill="none" stroke-width="4.5"/>

        <!-- Cute Rosy Cheeks (colorable!) -->
        <ellipse cx="388" cy="292" rx="14" ry="9" stroke-width="3.4"/>
        <ellipse cx="508" cy="268" rx="12" ry="8" stroke-width="3.4"/>

        <!-- Tiny Cute Nostrils -->
        <ellipse cx="454" cy="264" rx="3.4" ry="2.6" fill="#000" stroke="none"/>
        <ellipse cx="470" cy="260" rx="3.4" ry="2.6" fill="#000" stroke="none"/>

        <!-- Warm Friendly Turtle Smile -->
        <path d="M 416 286 Q 458 312 492 276" fill="none" stroke-width="5"/>
        <path d="M 412 282 Q 416 287 421 284 M 488 274 Q 493 277 497 273" fill="none" stroke-width="3.8"/>
      </g>
    </svg>
    """,
}


def make_transparent_ink_png(ink_strength_l: Image.Image, out_path: str):
    """Converts grayscale ink-intensity image (255 = solid ink, 0 = transparent) to RGBA warm brown PNG."""
    w, h = ink_strength_l.size
    rgba = Image.new("RGBA", (w, h), (INK_RGB[0], INK_RGB[1], INK_RGB[2], 0))
    rgba.putalpha(ink_strength_l)
    rgba.save(out_path, "PNG")
    subprocess.run(["optipng", "-quiet", "-o2", out_path], check=True)


def process_generated_page(src_jpg: str) -> Image.Image:
    im = Image.open(src_jpg).convert("L").resize((SIZE, SIZE), Image.Resampling.LANCZOS)

    def ramp(p):
        if p >= 225:
            return 0
        if p <= 95:
            return 255
        return int(round((225 - p) / 130.0 * 255.0))

    return im.point(ramp)


def render_vector_page(pw_page, svg_markup: str) -> Image.Image:
    # Render SVG crisply at 2x (1280x1280) and LANCZOS-downsample to 640x640 for silky anti-aliased ink!
    scaled_svg = svg_markup.replace('width="640" height="640"', 'width="1280" height="1280"', 1)
    html = f"<!doctype html><html><body style='margin:0;padding:0;background:#fff;'>{scaled_svg}</body></html>"
    pw_page.set_content(html)
    raw_png = os.path.join(SCRATCH_DIR, "_vec_tmp.png")
    pw_page.screenshot(path=raw_png, clip={"x": 0, "y": 0, "width": 1280, "height": 1280})
    im = Image.open(raw_png).convert("L").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    return im.point(
        lambda p: 0 if p >= 225 else (255 if p <= 95 else int(round((225 - p) / 130.0 * 255.0)))
    )


def preview_magic_fill(ink_l: Image.Image) -> tuple[Image.Image, int]:
    """Tests connected-component bucket fill segmentation and returns a cheerful colored preview."""
    w, h = ink_l.size
    barrier = ink_l.filter(ImageFilter.MaxFilter(3))
    bpx = barrier.load()
    labels = [-1] * (w * h)
    region_sizes = []
    rid = 0

    for y in range(h):
        for x in range(w):
            idx = y * w + x
            if bpx[x, y] < 120 and labels[idx] == -1:
                q = deque([(x, y)])
                labels[idx] = rid
                cnt = 0
                while q:
                    cx, cy = q.popleft()
                    cnt += 1
                    for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                        if 0 <= nx < w and 0 <= ny < h:
                            nidx = ny * w + nx
                            if bpx[nx, ny] < 120 and labels[nidx] == -1:
                                labels[nidx] = rid
                                q.append((nx, ny))
                region_sizes.append(cnt)
                rid += 1

    palette = [
        (255, 224, 90),
        (255, 160, 82),
        (122, 214, 128),
        (140, 212, 255),
        (255, 146, 188),
        (194, 152, 245),
        (255, 244, 178),
        (150, 232, 216),
    ]
    out = Image.new("RGBA", (w, h), (255, 253, 247, 255))
    opx = out.load()
    ipx = ink_l.load()
    big_regions = [i for i, sz in enumerate(region_sizes) if sz >= 320]
    color_map = {}
    for idx_i, r in enumerate(big_regions):
        color_map[r] = (182, 230, 255) if r == labels[2 * w + 2] else palette[idx_i % len(palette)]

    for y in range(h):
        for x in range(w):
            r = labels[y * w + x]
            a = ipx[x, y]
            base = color_map.get(r, (255, 253, 247))
            if a > 0:
                t = a / 255.0
                cr = int(base[0] * (1 - t) + INK_RGB[0] * t)
                cg = int(base[1] * (1 - t) + INK_RGB[1] * t)
                cb = int(base[2] * (1 - t) + INK_RGB[2] * t)
                opx[x, y] = (cr, cg, cb, 255)
            else:
                opx[x, y] = (base[0], base[1], base[2], 255)
    return out, len(big_regions)


def main():
    order = [
        "lion",
        "elephant",
        "whale",
        "penguin",
        "giraffe",
        "gorilla",
        "monkey",
        "frog",
        "panda",
        "turtle",
    ]
    inks = {}

    for k, src in GENERATED_PAGES.items():
        inks[k] = process_generated_page(src)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        pw_page = browser.new_page(viewport={"width": 1280, "height": 1280})
        for k, svg in VECTOR_STORYBOOK_PAGES.items():
            inks[k] = render_vector_page(pw_page, svg)
        browser.close()

    # Save all 10 optipng-compressed transparent line-art PNGs + visual contact sheets!
    thumb = 320
    sheet_blank = Image.new("RGBA", (thumb * 5, thumb * 2), (255, 253, 247, 255))
    sheet_filled = Image.new("RGBA", (thumb * 5, thumb * 2), (255, 253, 247, 255))
    total_kb = 0.0

    for idx, k in enumerate(order):
        out_path = os.path.join(OUT_IMG_DIR, f"coloring-{k}.png")
        make_transparent_ink_png(inks[k], out_path)
        kb = os.path.getsize(out_path) / 1024.0
        total_kb += kb

        # Blank preview over warm paper
        blank_tile = Image.new("RGBA", (SIZE, SIZE), (255, 253, 247, 255))
        ink_rgba = Image.open(out_path).convert("RGBA")
        blank_tile.alpha_composite(ink_rgba)
        filled_tile, n_regions = preview_magic_fill(inks[k])

        col = idx % 5
        row = idx // 5
        sheet_blank.paste(blank_tile.resize((thumb, thumb), Image.Resampling.LANCZOS), (col * thumb, row * thumb))
        sheet_filled.paste(filled_tile.resize((thumb, thumb), Image.Resampling.LANCZOS), (col * thumb, row * thumb))
        print(f"  coloring-{k}.png: {kb:.1f} KB, {n_regions} bucket-fillable regions")

    blank_sheet_path = os.path.join(SCRATCH_DIR, "all_10_coloring_blank_v2.png")
    filled_sheet_path = os.path.join(SCRATCH_DIR, "all_10_coloring_filled_v2.png")
    sheet_blank.save(blank_sheet_path)
    sheet_filled.save(filled_sheet_path)
    print(f"Done! All 10 coloring pages total = {total_kb:.1f} KB")
    print(f"Sheets saved: {blank_sheet_path} & {filled_sheet_path}")


if __name__ == "__main__":
    main()
