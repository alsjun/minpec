import { GOLD_LEVELS, RAID_GOLD } from '../seed'

const fmt = (n: number) => n.toLocaleString('ko-KR')

export default function GoldView() {
  return (
    <div className="view gold-view">
      <section>
        <h3>레벨 구간별 주간 골드</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>레벨</th>
                <th className="num">유통 골드</th>
                <th className="num">귀속 골드</th>
                <th className="num">총액</th>
              </tr>
            </thead>
            <tbody>
              {GOLD_LEVELS.map((g) => (
                <tr key={g.level}>
                  <td>{g.level}</td>
                  <td className="num">{fmt(g.tradable)}</td>
                  <td className="num">{fmt(g.bound)}</td>
                  <td className="num gold">{fmt(g.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3>레이드별 골드</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>레이드</th>
                <th>난이도</th>
                <th className="num">유통 골드</th>
                <th className="num">귀속 골드</th>
                <th className="num">총액</th>
              </tr>
            </thead>
            <tbody>
              {RAID_GOLD.map((g, i) => (
                <tr key={i}>
                  <td>{g.raid}</td>
                  <td>{g.difficulty}</td>
                  <td className="num">{fmt(g.tradable)}</td>
                  <td className="num">{fmt(g.bound)}</td>
                  <td className="num gold">{fmt(g.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="hint">골드표는 정적 데이터입니다. 값이 바뀌면 src/seed.ts에서 수정해 주세요.</p>
    </div>
  )
}
