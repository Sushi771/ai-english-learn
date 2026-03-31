import azure.cognitiveservices.speech as speechsdk
import os
import random

class SpeechService:
    def __init__(self):
        self.speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.service_region = os.getenv("AZURE_SPEECH_REGION")

    async def assess_pronunciation(self, audio_path: str, reference_text: str):
        # Handle placeholder keys for testing without real Azure credentials
        placeholders = ["placeholder", "your_azure_key", "YOUR_AZURE_KEY", "none", ""]
        if not self.speech_key or str(self.speech_key).lower() in placeholders:
            # Generate placeholder words for highlighting
            words = []
            for w in reference_text.split():
                word_clean = w.strip(".,!?")
                words.append({
                    "word": word_clean,
                    "accuracy_score": random.randint(70, 95),
                    "error_type": "None" if random.random() > 0.2 else "Mispronunciation",
                    "phonemes": [
                        {"phoneme": char, "pronunciation_score": random.randint(70, 95)}
                        for char in list(word_clean)[:3]
                    ]
                })

            return {
                "text": reference_text,
                "accuracy_score": random.randint(70, 95),
                "pronunciation_score": random.randint(75, 98),
                "completeness_score": 100,
                "fluency_score": random.randint(80, 99),
                "words": words
            }

        try:
            speech_config = speechsdk.SpeechConfig(subscription=self.speech_key, region=self.service_region)
            audio_config = speechsdk.audio.AudioConfig(filename=audio_path)
            
            pronunciation_config = speechsdk.PronunciationAssessmentConfig(
                reference_text=reference_text,
                grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
                granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
                enable_miscue=True
            )

            speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
            pronunciation_config.apply_to(speech_recognizer)

            # Note: recognize_once is a blocking call, for high performance use recognize_once_async
            result = speech_recognizer.recognize_once()
            
            if result.reason == speechsdk.ResultReason.RecognizedSpeech:
                pronunciation_result = speechsdk.PronunciationAssessmentResult(result)
                
                # Extract detailed word-level data
                words = []
                for word in pronunciation_result.words:
                    word_data = {
                        "word": word.word,
                        "accuracy_score": word.accuracy_score,
                        "error_type": word.error_type,
                        "phonemes": []
                    }
                    if word.phonemes:
                        for phoneme in word.phonemes:
                            word_data["phonemes"].append({
                                "phoneme": phoneme.phoneme,
                                "pronunciation_score": phoneme.pronunciation_score
                            })
                    words.append(word_data)

                return {
                    "text": result.text,
                    "accuracy_score": pronunciation_result.accuracy_score,
                    "pronunciation_score": pronunciation_result.pronunciation_score,
                    "completeness_score": pronunciation_result.completeness_score,
                    "fluency_score": pronunciation_result.fluency_score,
                    "words": words
                }
            else:
                return {"text": "", "error": f"Recognition failed: {result.reason}"}
        except Exception as e:
            print(f"Azure Speech Error: {e}")
            return {"text": "", "error": str(e)}

speech_service = SpeechService()
