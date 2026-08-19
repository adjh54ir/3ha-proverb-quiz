#!/bin/bash
# 사운드 원본(WAV/MP3)을 앱에 넣을 AAC(.m4a)로 재인코딩한다.
#
# 왜: 원본 WAV는 1411kbps 무손실이라 효과음 11개만 약 4MB.
#     AAC 96kbps + 무음 트리밍으로 플랫폼당 10MB -> 2.6MB.
#
# 사용법: ./scripts/encode-sounds.sh <원본_디렉터리>
#   예)  ./scripts/encode-sounds.sh ../3ha-korea-quiz/assets/sounds
#
# 결과물은 android/app/src/main/res/raw/ 와 ios/ 양쪽에 복사된다.
# iOS는 새 파일 추가 시 Xcode 프로젝트의 Resources 빌드 페이즈 등록이 별도로 필요하다.
# afconvert는 macOS 기본 제공(별도 설치 불필요), mp3 인코딩은 지원하지 않아 AAC를 쓴다.
set -euo pipefail

SRC="${1:?사용법: ./scripts/encode-sounds.sh <원본_디렉터리>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$ROOT/android/app/src/main/res/raw"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BITRATE=96000

mkdir -p "$RAW"

echo "▶ 무음 트리밍 + AAC ${BITRATE}bps 인코딩"
for f in "$SRC"/*.wav "$SRC"/*.mp3; do
	[ -e "$f" ] || continue
	base="$(basename "$f")"
	# res/raw 이름 규칙: 소문자 + 숫자 + 밑줄만 허용 (하이픈 불가)
	name="$(echo "${base%.*}" | tr '[:upper:]-' '[:lower:]_')"

	if [[ "$f" == *.wav ]]; then
		python3 "$ROOT/scripts/trim-silence.py" "$f" "$TMP/$name.wav"
		input="$TMP/$name.wav"
	else
		input="$f" # mp3는 트리밍 없이 재인코딩만
	fi

	afconvert -f m4af -d aac -b "$BITRATE" "$input" "$TMP/$name.m4a"
done

cp "$TMP"/*.m4a "$RAW/"
cp "$TMP"/*.m4a "$ROOT/ios/"

echo "▶ 완료 — 플랫폼당 $(du -ch "$RAW"/*.m4a | tail -1 | cut -f1)"
