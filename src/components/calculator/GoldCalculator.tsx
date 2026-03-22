// 기존 호환 래퍼 — 테스트 및 기존 import 유지
import MetalCalculator from './MetalCalculator'

export default function GoldCalculator() {
  return <MetalCalculator metal="gold" />
}
