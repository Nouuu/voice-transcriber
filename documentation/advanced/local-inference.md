# Local Inference Roadmap - Whisper Local Transcription

**Goal**: Implement local Whisper transcription using CPU-only inference for offline usage and cost reduction.

**Status**: ✅ Implementation Complete - Documentation Pending
**Priority**: High 🔥

---

## Implementation Summary

**Approach**: Speaches (Self-hosted OpenAI-compatible server)

**Why Speaches**:
- ✅ OpenAI API-compatible (drop-in replacement, zero code changes)
- ✅ Docker-based deployment (simple setup)
- ✅ Dynamic model loading (on-demand)
- ✅ Production-ready and actively maintained
- ✅ CPU/GPU support

**Configuration-Based Routing**:
```json
{
  "transcription": {
    "backend": "openai",  // or "speaches"
    "openai": {
      "apiKey": "sk-...",
      "model": "whisper-1"
    },
    "speaches": {
      "url": "http://localhost:8000/v1",
      "apiKey": "none",
      "model": "Systran/faster-whisper-base"
    }
  }
}
```

---

## Deployment Modes

### 1. OpenAI Cloud (Default) ☁️
```json
{ "transcription": { "backend": "openai" } }
```
- ✅ Zero setup
- ✅ Proven reliability
- ❌ Requires internet
- ❌ API costs

### 2. Speaches Local 🏠
```json
{ "transcription": { "backend": "speaches" } }
```
- ✅ 100% offline
- ✅ Zero API costs
- ✅ Complete privacy
- ❌ Requires Docker

### 3. Speaches Remote 🌐
```json
{ 
  "transcription": { 
    "backend": "speaches",
    "speaches": {
      "url": "http://your-server:8000/v1"
    }
  }
}
```
- ✅ Dedicated resources
- ✅ Multi-user support
- ✅ GPU acceleration
- ❌ Requires server setup

---

## Docker Setup (Local)

**docker-compose.speaches.yml**:
```yaml
services:
  speaches:
    image: ghcr.io/speaches-ai/speaches:latest-cpu
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./hf-cache:/home/ubuntu/.cache/huggingface/hub
    environment:
      # Keep model loaded in memory forever (zero-latency transcription)
      - STT_MODEL_TTL=-1
      # CPU inference configuration
      - WHISPER__INFERENCE_DEVICE=cpu
      - WHISPER__COMPUTE_TYPE=int8
      - WHISPER__CPU_THREADS=8
      - WHISPER__USE_BATCHED_MODE=true
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 4G
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Commands**:
```bash
docker compose -f docker-compose.speaches.yml up -d
curl http://localhost:8000/health
```

---

## Model Selection

| Model | Size | Memory | Use Case | Speed |
|-------|------|--------|----------|-------|
| **tiny** | 75 MB | ~273 MB | Fast, lower accuracy | Very fast |
| **base** | 142 MB | ~388 MB | Good balance ⭐ | Fast |
| **small** | 466 MB | ~852 MB | Better accuracy | Medium |
| **medium** | 1.5 GB | ~2.1 GB | High accuracy | Slower |
| **large-v3** | 2.9 GB | ~3.9 GB | Best accuracy | Slowest |

**Recommendation**: Use `base` for voice dictation (fast + good accuracy)

---

## Implementation Phases

### ✅ Phase 4.1: Research & Architecture (COMPLETED)
- [x] Research Speaches capabilities
- [x] Validate OpenAI compatibility
- [x] Design configuration architecture

**Status**: Completed - Speaches validated as best solution

---

### ✅ Phase 4.2: Configuration Support (COMPLETED)

**Goal**: Add configuration-based backend selection

**Implemented Config Schema**:
```json
{
  "transcription": {
    "backend": "openai",
    "openai": {
      "apiKey": "sk-...",
      "model": "whisper-1"
    },
    "speaches": {
      "url": "http://localhost:8000/v1",
      "apiKey": "none",
      "model": "Systran/faster-whisper-base"
    }
  }
}
```

**Completed Tasks**:
- [x] Add `transcription.backend` field ('openai' | 'speaches')
- [x] Add `transcription.speaches.url` and `transcription.speaches.model`
- [x] Add `transcription.openai.apiKey` and `transcription.openai.model`
- [x] Update `Config.getTranscriptionConfig()` to return all fields
- [x] Add URL validation for Speaches (`validateSpeachesUrl()`)
- [x] Update `config.example.json` with new structure
- [x] Add tests for new config fields
- [x] Add `benchmarkMode` for side-by-side comparison

**Files Modified**: 
- ✅ `src/config/config.ts` - Full implementation
- ✅ `config.example.json` - Updated with new schema
- ✅ `src/config/config.test.ts` - Tests added

---

### ✅ Phase 4.3: TranscriptionService Refactor (COMPLETED)

**Goal**: Lazy initialization + unified transcription method

**Implemented Architecture**:
- ✅ Lazy client initialization via `getClient(backend)`
- ✅ `initializeSpeaches()` with proper async/await and error handling
- ✅ `loadSpeachesModel()` for model preloading
- ✅ Single unified `transcribe()` method (no separate methods)
- ✅ `warmup()` method for startup model preloading

**Completed Tasks**:
- [x] Add `getClient(backend: 'openai' | 'speaches')` method
- [x] Implement lazy initialization (clients created on-demand)
- [x] Add `initializeSpeaches()` with full error handling
- [x] Add `loadSpeachesModel()` with POST to `/v1/models/{model}`
- [x] Single `transcribe()` method supporting both backends
- [x] Add `warmup()` for preloading at startup
- [x] Proper error propagation and logging
- [x] Add tests for both backends
- [x] Add tests for lazy initialization
- [x] Add tests for error handling

**Implementation Details**:
```typescript
// Lazy initialization - clients created only when needed
private async getClient(backend: "openai" | "speaches"): Promise<...>

// Preload Speaches model at startup (called from VoiceTranscriberApp)
public async warmup(forceSpeaches = false): Promise<...>

// Single transcribe method - backend determined by config
public async transcribe(filePath: string): Promise<...>
```

**Files Modified**: 
- ✅ `src/services/transcription.ts` - Full refactor
- ✅ `src/services/transcription.test.ts` - Comprehensive tests
- ✅ `src/index.ts` - Calls `warmup()` on startup

---

### ✅ Phase 4.3b: Speaches Model Preloading (COMPLETED)

**Goal**: Keep model loaded in memory for zero-latency transcription

**Implementation**:
1. **Application-level preloading**: 
   - `TranscriptionService.warmup()` called at app startup
   - `loadSpeachesModel()` POSTs to `/v1/models/{model}`
   - Conditional preload (Speaches backend OR benchmark mode)

2. **Docker-level persistence**:
   - `STT_MODEL_TTL=-1` in environment variables (never unload)
   - Healthcheck validates server availability

**Completed Tasks**:
- [x] Implement `loadSpeachesModel()` with POST to model endpoint
- [x] Add `warmup()` method for startup preloading
- [x] Call `warmup()` from main app when using Speaches
- [x] Add `STT_MODEL_TTL=-1` to docker-compose environment
- [x] Docker healthcheck for server availability
- [x] Cache directory mounted (`./hf-cache`)

**Files Modified**: 
- ✅ `src/services/transcription.ts` - `warmup()` and `loadSpeachesModel()`
- ✅ `src/index.ts` - Calls `warmup()` on startup
- ✅ `docker-compose.speaches.yml` - All environment variables included

---

### ✅ Phase 4.3c: Main Application Integration (COMPLETED)

**Goal**: Clean architecture with unified processing

**Implementation**:
- ✅ Single `processAudioFile()` for normal mode
- ✅ Separate `processBenchmark()` for comparison mode
- ✅ No legacy methods (clean architecture from start)
- ✅ Benchmark mode creates two TranscriptionService instances
- ✅ Detailed comparison metrics (performance, similarity, differences)

**Completed Tasks**:
- [x] Implement `processAudioFile()` using unified transcription
- [x] Implement `processBenchmark()` for side-by-side comparison
- [x] Add similarity analysis (Levenshtein distance)
- [x] Add text difference detection
- [x] Choose best result automatically (longest transcription)
- [x] Update tests for new architecture

**Architecture**:
```typescript
// Normal mode: Uses configured backend
async processAudioFile(filePath: string): Promise<void>

// Benchmark mode: Compares both backends side-by-side
async processBenchmark(filePath: string): Promise<void>
```

**Files Modified**: 
- ✅ `src/services/audio-processor.ts` - Both modes implemented
- ✅ `src/services/audio-processor.test.ts` - Tests for both modes
- ✅ `src/index.ts` - Conditional logic based on `benchmarkMode`
- ✅ `src/utils/text-similarity.ts` - Similarity utilities

---

### ⚠️ Phase 4.4: Documentation (PARTIAL)

**Goal**: Complete user-facing documentation

**Completed**:
- [x] `docker-compose.speaches.yml` with environment variables
- [x] `config.example.json` with new schema
- [x] Code documentation (JSDoc comments)
- [x] This roadmap document

**Missing**:
- [ ] Create `docs/SPEACHES_SETUP.md` guide
- [ ] Update main `README.md` with Speaches section
- [ ] Add troubleshooting guide for Speaches
- [ ] Document benchmark mode usage
- [ ] Add performance comparison data

**Priority**: 🔥 High - Users need setup instructions

---

### ✅ Phase 4.5: Testing & Validation (COMPLETED)

**Completed**:
- [x] Unit tests for TranscriptionService
- [x] Unit tests for Config
- [x] Unit tests for AudioProcessor
- [x] Tests for both OpenAI and Speaches backends
- [x] Tests for lazy initialization
- [x] Tests for error handling
- [x] Tests for benchmark mode
- [x] Similarity calculation tests

**Test Coverage**:
- ✅ `src/config/config.test.ts` - Configuration validation
- ✅ `src/services/transcription.test.ts` - Backend switching
- ✅ `src/services/audio-processor.test.ts` - Processing workflows
- ✅ `src/utils/text-similarity.test.ts` - Comparison utilities

**Manual Testing Needed**:
- [ ] Real Speaches deployment test
- [ ] Model loading performance benchmarks
- [ ] Multi-language validation
- [ ] Long audio file tests

---

### 📋 Phase 4.6: Release (PLANNED)

**Goal**: Prepare for production release

**Tasks**:
- [ ] Complete documentation (Phase 4.4)
- [ ] Manual testing with real Speaches instance
- [ ] Performance benchmarking documentation
- [ ] Update CHANGELOG.md
- [ ] Version bump to 0.3.0
- [ ] Git tag and release notes
- [ ] Update README badges/status

**Blocked by**: Phase 4.4 (Documentation)

---

## Implementation Timeline

**Total Duration**: ~4 days (3.5 days completed)

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| 4.1 Research | 1 day | 1 day | ✅ Done |
| 4.2 Config | 0.5 days | 0.5 days | ✅ Done |
| 4.3 Service | 0.5 days | 1 day | ✅ Done (more comprehensive) |
| 4.3b Preload | - | 0.5 days | ✅ Done (added scope) |
| 4.3c Integration | - | 0.5 days | ✅ Done (added scope) |
| 4.4 Docs | 1 day | - | ⚠️ Partial |
| 4.5 Testing | 1 day | 0.5 days | ✅ Done |
| 4.6 Release | 0.5 days | - | 📋 Planned |

**Progress**: 85% complete (implementation done, documentation pending)

---

## Additional Features Implemented

### 🔬 Benchmark Mode
- Compare OpenAI and Speaches side-by-side
- Performance metrics (speed, duration)
- Text similarity analysis (Levenshtein distance)
- Word-level difference detection
- Automatic best result selection
- Enable via `"benchmarkMode": true` in config

### 🎯 Text Similarity Analysis
- Levenshtein distance calculation
- Character-level and word-level comparison
- Difference highlighting
- Similarity percentage scoring

### ⚡ Zero-Latency Transcription
- Model preloading at startup
- Persistent model in Docker (STT_MODEL_TTL=-1)
- Lazy client initialization
- Minimal overhead for second+ transcriptions

---

## Known Issues & Limitations

### Current Limitations:
1. **Documentation**: Setup guides incomplete (Phase 4.4)
2. **Manual Testing**: No real-world Speaches deployment tested yet
3. **Performance Data**: No documented benchmarks yet

### Future Improvements:
1. GPU support documentation
2. Multiple model support (runtime switching)
3. Remote Speaches server examples
4. Performance tuning guide
5. Cost analysis (OpenAI vs self-hosted)

---

## Next Steps

### Immediate (Phase 4.4 - Documentation):
1. Create `docs/SPEACHES_SETUP.md` comprehensive guide
2. Update main `README.md` with Speaches section
3. Add troubleshooting section
4. Document benchmark mode

### Before Release (Phase 4.6):
1. Manual test with real Speaches deployment
2. Run benchmark mode with sample audio
3. Document performance results
4. Update CHANGELOG
5. Version bump and release

---

## References

- [Speaches GitHub](https://github.com/speaches-ai/speaches)
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference/audio)
- [Docker Docs](https://docs.docker.com/)
- [Levenshtein Distance](https://en.wikipedia.org/wiki/Levenshtein_distance)

---

**Version**: v3.0 (Updated with actual implementation status)
**Last Updated**: 2025-01-11
**Project Status**: 🟢 Implementation Complete - Documentation Pending
