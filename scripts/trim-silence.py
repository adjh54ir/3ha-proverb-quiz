"""WAV 앞뒤 무음 구간 제거 — 표준 라이브러리만 사용 (encode-sounds.sh에서 호출).

임계값 -60dBFS 이하는 사실상 들리지 않는 구간으로 보고 잘라낸다.
앞뒤 30ms 여유를 남겨 클릭음(팝 노이즈)이 생기지 않게 한다.

사용법: python3 scripts/trim-silence.py <입력.wav> <출력.wav>
"""

import array
import sys
import wave

THRESHOLD_DB = -60.0
PAD_MS = 30


def trim(src: str, dst: str) -> tuple[float, float]:
	with wave.open(src, "rb") as w:
		ch, width, rate, frames = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
		data = w.readframes(frames)

	if width != 2:
		raise SystemExit(f"{src}: 16bit PCM만 지원 (sampwidth={width})")

	threshold = float(1 << 15) * (10 ** (THRESHOLD_DB / 20))
	frame_bytes = ch * width
	win = max(1, rate // 200)  # 5ms 단위로 검사
	samples = array.array("h")
	samples.frombytes(data)

	def loud(i: int) -> bool:
		chunk = samples[i * ch : (i + win) * ch]
		return bool(chunk) and max(max(chunk), -min(chunk)) > threshold

	starts = range(0, frames, win)
	first = next((i for i in starts if loud(i)), None)
	if first is None:  # 전 구간 무음 — 원본 유지
		return frames / rate, frames / rate
	last = next(i for i in reversed(list(starts)) if loud(i))

	pad = int(rate * PAD_MS / 1000)
	begin = max(0, first - pad)
	end = min(frames, last + win + pad)

	with wave.open(dst, "wb") as out:
		out.setnchannels(ch)
		out.setsampwidth(width)
		out.setframerate(rate)
		out.writeframes(data[begin * frame_bytes : end * frame_bytes])

	return frames / rate, (end - begin) / rate


if __name__ == "__main__":
	before, after = trim(sys.argv[1], sys.argv[2])
	print(f"  {sys.argv[1].split('/')[-1]}: {before:.2f}s -> {after:.2f}s")
