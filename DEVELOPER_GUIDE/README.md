# 🎮 OOPS! — Complete Developer Documentation & Execution Chronicle
### *A Transparent, In-Depth Engineering Guide to Building, Understanding, and Extending Oops!*

**Project**: Oops! (2.5D Deceptive Puzzle Platformer)  
**Author & Creator**: Khalid Abdullah  
**Core Framework**: Phaser 3.80.1 (Arcade Physics) + Procedural Web Audio API + HTML5/CSS3  
**Status**: v1.03 Stable Baseline (World 1 Frozen, 30 Handcrafted Stages)  

---

## 🌟 What is This Folder?

This folder is the **complete, transparent developer knowledge base** for the OOPS! game project. 

Instead of treating the game as a "black box" where AI wrote thousands of lines of magical code that nobody understands, this documentation explains **every single prompt ever given**, **how it was executed**, **every block of code**, **why specific architectures were chosen**, and **how you can manually build, modify, debug, and extend this game yourself like a professional game developer**.

---

## 📚 Master Table of Contents

| Document | Description | Key Focus Areas |
|:---|:---|:---|
| **[01. User Prompts & Execution Chronicle](./01_USER_PROMPTS_AND_EXECUTION_CHRONICLE.md)** | **Every Prompt Analyzed** | Complete chronological history of all user prompts, what was asked, the root problems diagnosed, step-by-step execution, and what code was created. |
| **[02. Full Code Breakdown: game.js](./02_FULL_CODE_BREAKDOWN_GAME_JS.md)** | **Every Line of Game Logic** | Complete section-by-section and function-by-function walkthrough of the 3,429 lines in `game.js` (SafeStorage, AudioEngine, MobileGamepad, MonetizationManager, 5 Scenes, 30 Levels). |
| **[03. Web, UI & Technical Infrastructure](./03_FULL_CODE_BREAKDOWN_WEB_AND_UI.md)** | **Architecture & Monetization** | Deep dive into `play.html`, `index.html`, `portal.css`, `style.css`, Google H5 Ads SDK, `ads.txt`, Schema.org structured data, and SEO. |
| **[04. Professional Game Developer Handbook](./04_HOW_TO_DEVELOP_LIKE_A_PRO.md)** | **Hands-On Manual Skills** | Practical guide: how to add a level manually, create a new trap from scratch, debug physics bugs without AI, and optimize performance. |

---

## 🏛️ High-Level Architectural Mental Model

```
┌────────────────────────────────────────────────────────────────────────┐
│                          1. BROWSER DOM LAYER                          │
│   • index.html: Rich publisher content hub & SEO guide                 │
│   • play.html: Clean game container, canvas mount, & top navigation    │
│   • #mobile-gamepad: DOM touch cluster forwarding booleans to Phaser   │
│   • Modal Overlays: Feedback Form, 7-Death Rewarded Ad Offer Dialog    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Event Bridge
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        2. PHASER 3 ENGINE LAYER                        │
│   • Virtual Resolution: 960x540 (Scale.FIT & Scale.CENTER_BOTH)        │
│   • Physics: 2D Arcade Physics (Gravity: y = 1550 px/s²)               │
│                                                                        │
│   Scene State Flow:                                                    │
│   BootScene ──► IntroScene ──► WorldSelectScene ◄──► GameScene         │
│                                                          │             │
│                                                  (Clear Stage 30)      │
│                                                          ▼             │
│                                                  WorldCompleteScene    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Controls / Hooks
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       3. MODULAR LOGIC SUBSYSTEMS                      │
│   • SafeStorage: In-memory fallback for private browsing localStorage  │
│   • AudioEngine: 100% Procedural Web Audio API sound synthesis         │
│   • SaveManager: Stage unlock records & cumulative death tallies       │
│   • MonetizationManager: 7-death threshold & Google H5 Placement API   │
│   • buildWorld1Level(): Geometry & trap definitions for all 30 stages  │
└────────────────────────────────────────────────────────────────────────┘
```
