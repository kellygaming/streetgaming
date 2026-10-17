# BLACK NIGHT TO DARKSIDE — Film animé réaliste (pipeline Blender → fal.ai)

## Objectif
Transformer une histoire (`story.md`, saison 1) en film au rendu
**PHOTORÉALISTE**. Pas de style dessin/cartoon IA. 3D « potable »,
pas de modélisation lourde : Blender sert de squelette de mise en scène,
le réalisme vient d'un modèle vidéo IA sur fal.ai.

## Prérequis
- Blender appelable en CLI (`blender -b -P script.py`)
- Variable d'env `FAL_KEY` (voir `.env.example`) + `pip install -r requirements.txt`
- ffmpeg pour le montage

## Pipeline
1. **DÉCOUPAGE** (Claude)
   - `story.md` → `shots.json` : id, durée (3–5 s max), cadrage, mouvement
     caméra, action, personnages, décor, dialogue / voix off.
   - Fiches personnages et décors (description physique précise, tenue,
     âge, lumière) → `characters.json`, `sets.json`.
2. **BLOCKOUT BLENDER** (scripts Python headless, `blender/scenes/`)
   - Un script réutilisable par décor (primitives simples, sol, murs, props).
   - Personnages = mannequins low-poly riggés.
   - Caméra animée selon `shots.json`.
   - Export par plan : rendu « clay » (MP4) + passe Depth (Z normalisé).
   - EEVEE, 720p, 24 fps.
3. **HABILLAGE RÉALISTE** (fal.ai)
   - a) Image de référence photoréaliste par personnage → `fal/refs/`
        (planche : face, 3/4, profil, plein pied).
   - b) Par plan : vidéo video-to-video guidée par depth/pose Blender +
        image de référence perso. Modèle choisi en vérifiant la doc fal.
   - Prompts en anglais : "cinematic, photorealistic, natural lighting, 35mm film".
4. **FINITION**
   - Voix (TTS) + lipsync si dialogues, musique.
   - Montage final ffmpeg → `final/`.

## Structure
```
story.md  personnages.md  shots.json  characters.json  sets.json
blender/scenes/*.py      renders/clay/   renders/depth/
fal/refs/  fal/outputs/  audio/          final/
scripts/                 # 1 étape = 1 script relançable sur un seul plan
```

## Règles
- Commencer par **UN PLAN PILOTE** complet (blockout → fal → rendu) et
  montrer le résultat + coût réel **avant** de traiter tout le film.
- Estimer le coût fal par seconde de vidéo avant chaque batch.
- Code modulaire : 1 étape = 1 script relançable sur un seul plan.
- Les médias générés ne sont pas versionnés dans git (voir `.gitignore`).
- Format : **16:9 (YouTube)**. Les versions 9:16 seront recadrées au montage.
