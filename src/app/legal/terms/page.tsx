import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "用户协议 · 衣橱镜像",
  description: "衣橱镜像用户协议草案：服务说明、账号规则、用户内容、AI 限制与数据存储。",
};

function Pending() {
  return <mark className="legal-pending">待补充</mark>;
}

export default function TermsPage() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            衣橱镜像
          </Link>
          <nav className="nav-links">
            <Link href="/login">登录</Link>
            <Link href="/register">注册</Link>
          </nav>
        </div>
      </header>

      <main className="page legal-page">
        <div className="legal-back">
          <Link href="/login">← 返回登录</Link>
          <span>·</span>
          <Link href="/register">返回注册</Link>
        </div>

        <h1>用户协议</h1>
        <p className="legal-meta">
          版本：v0.4 草案 ｜ 生效日期：<Pending /> ｜ 更新日期：<Pending />
        </p>

        <div className="legal-notice" role="note">
          本协议目前为草案。文中标记为「待补充」的主体名称、联系方式、生效日期、
          备案信息与责任条款，需在正式上线前补齐并完成法务确认；补齐前本协议不构成
          最终法律文件。
        </div>

        <nav className="legal-toc" aria-label="用户协议目录">
          <strong>本页目录</strong>
          <ol>
            <li><a href="#parties">协议主体与生效</a></li>
            <li><a href="#service">服务说明</a></li>
            <li><a href="#account">账号注册与安全</a></li>
            <li><a href="#content">用户内容与授权</a></li>
            <li><a href="#rules">使用规则</a></li>
            <li><a href="#ai">AI 功能说明与限制</a></li>
            <li><a href="#storage">数据存储与跨境传输</a></li>
            <li><a href="#ip">知识产权</a></li>
            <li><a href="#changes">服务变更、中断与终止</a></li>
            <li><a href="#liability">免责与责任限制</a></li>
            <li><a href="#updates">协议更新</a></li>
            <li><a href="#law">适用法律与争议解决</a></li>
            <li><a href="#contact">联系方式</a></li>
          </ol>
        </nav>

        <article className="legal-body">
          <section className="legal-section" id="parties">
            <h2>1. 协议主体与生效</h2>
            <p>
              本协议由衣橱镜像的运营主体（全称：<Pending />，以下简称“运营方”）
              与用户订立。运营方注册地址、联系邮箱：<Pending />。
            </p>
            <p>
              用户注册、登录或使用本服务，即表示已阅读并同意本协议与《隐私协议》。
              如不同意，请停止注册或使用。生效日期：<Pending />。
            </p>
          </section>

          <section className="legal-section" id="service">
            <h2>2. 服务说明</h2>
            <p>
              本服务提供现实衣柜的数字档案功能，包括：邮箱账号注册与登录；衣物照片
              上传、AI 属性建议与人工确认；衣物列表、详情、编辑与删除；事件记录与
              状态变化；A4 标签生成；以及凭标签 token 免登录扫码记录。
            </p>
            <p>
              当前服务不收费；后续是否收费、计费方式与免费额度：<Pending />。
              服务功能、可用性与维护安排可能调整，具体以实际提供为准。
            </p>
          </section>

          <section className="legal-section" id="account">
            <h2>3. 账号注册与安全</h2>
            <ul>
              <li>用户使用邮箱与密码注册；应提供可用的邮箱并妥善保管密码。</li>
              <li>账号仅限注册用户本人使用，不得转让、出租或与他人共用。</li>
              <li>
                当前未提供邮箱验证、找回密码或第三方登录；如忘记密码或账号异常，
                请联系 <Pending />。
              </li>
              <li>
                因用户主动泄露密码、共用账号或未及时报告异常导致的损失，责任划分：
                <Pending />。
              </li>
            </ul>
          </section>

          <section className="legal-section" id="content">
            <h2>4. 用户内容与授权</h2>
            <p>
              用户上传的衣物照片、属性、价格、购买日期、备注及事件记录等，权利归
              用户或原权利人所有。用户授予运营方为提供、维护与改进本服务所必需的
              存储、处理、展示与备份授权。
            </p>
            <p>
              为提供 AI 识别，压缩后的衣物照片会发送给火山方舟（Ark）视觉模型
              服务商处理；用户理解并同意该处理环节涉及第三方与数据跨境传输。
            </p>
            <p>
              用户删除衣物或账号后，相应授权在服务范围内终止；备份、日志及依法
              需要保留的数据处理期限：<Pending />。
            </p>
          </section>

          <section className="legal-section" id="rules">
            <h2>5. 使用规则</h2>
            <ul>
              <li>不得利用本服务从事违法活动或侵害他人合法权益。</li>
              <li>不得上传无权使用的照片、资料或包含他人敏感信息的内容。</li>
              <li>
                不得尝试越权访问他人衣物、标签或账号，不得绕过归属校验、限流或
                其他安全措施。
              </li>
              <li>
                不得对本服务进行反向工程、批量抓取、自动化攻击或干扰正常运行。
              </li>
              <li>
                违反上述规则的处理方式、申诉渠道与后果：<Pending />。
              </li>
            </ul>
          </section>

          <section className="legal-section" id="ai">
            <h2>6. AI 功能说明与限制</h2>
            <ul>
              <li>
                AI 只生成衣物属性建议，不直接写入数据库；用户需在确认页面自行
                核对后保存。
              </li>
              <li>
                识别结果可能不准确、不完整或过时；低置信度字段不会自动预填，
                品牌恒显示为「不确定」，材质仅作为建议。
              </li>
              <li>
                AI 结果不构成专业意见或对衣物材质、价值、洗护方式的保证；用户应
                按衣物实际标签和专业建议处理。
              </li>
              <li>
                模型服务商、模型版本或调用方式可能调整；服务中断或结果变化的具体
                处理：<Pending />。
              </li>
            </ul>
          </section>

          <section className="legal-section" id="storage">
            <h2>7. 数据存储与跨境传输</h2>
            <p>
              <strong>本项目服务器位于香港，用户数据存储于香港，属于数据跨境
              传输。</strong>
              用户注册、登录、上传照片、使用 AI 识别或扫码记录时，相关数据可能
              传输至香港并在当地处理与保存。
            </p>
            <p>
              数据收集、用途、保存期限、第三方处理与用户权利的详细说明见
              <Link href="/legal/privacy">《隐私协议》</Link>。
              备案信息：<Pending />；本项目服务器位于香港，当前部署方案不涉及
              境内 ICP 备案。
            </p>
          </section>

          <section className="legal-section" id="ip">
            <h2>8. 知识产权</h2>
            <p>
              本服务的界面、文案、代码、标签版式与品牌标识等，其权利归运营方或
              相应权利人所有，具体归属与授权范围：<Pending />。未经许可，用户
              不得复制、修改、分发或用于与本服务无关的商业用途。
            </p>
            <p>
              用户内容的知识产权归用户或原权利人；本协议不因服务使用而转移用户
              内容的所有权。
            </p>
          </section>

          <section className="legal-section" id="changes">
            <h2>9. 服务变更、中断与终止</h2>
            <p>
              运营方可能因维护、升级、安全、不可抗力或业务调整而变更、中断或终止
              全部或部分服务。通知方式、提前通知期限、终止后的数据处理与退款安排：
              <Pending />。
            </p>
            <p>
              用户可停止使用服务并申请删除账号；账号删除的具体流程与数据清理安排：
              <Pending />。
            </p>
          </section>

          <section className="legal-section" id="liability">
            <h2>10. 免责与责任限制</h2>
            <p>
              在适用法律允许的范围内，本服务对因使用或无法使用服务产生的责任限制、
              赔偿范围及免责情形，以正式法务文本为准；具体条款：<Pending />。
            </p>
            <p>
              本协议不排除或限制依法不得排除或限制的责任。AI 识别结果、第三方
              服务中断、用户设备或网络问题导致的后果，责任划分：<Pending />。
            </p>
          </section>

          <section className="legal-section" id="updates">
            <h2>11. 协议更新</h2>
            <p>
              本协议在本页标注版本、更新日期与生效日期；重大变更的通知
              方式、用户重新确认方式：<Pending />。更新后继续使用本服务，视为
              接受更新后的协议；具体规则：<Pending />。
            </p>
          </section>

          <section className="legal-section" id="law">
            <h2>12. 适用法律与争议解决</h2>
            <p>
              本协议的适用法律、争议解决方式、管辖法院或仲裁机构：
              <Pending />。在相关条款确定前，双方应先友好协商；协商不成的处理
              方式：<Pending />。
            </p>
          </section>

          <section className="legal-section" id="contact">
            <h2>13. 联系方式</h2>
            <ul>
              <li>运营主体：<Pending /></li>
              <li>联系邮箱：<Pending /></li>
              <li>联系地址：<Pending /></li>
              <li>投诉与举报渠道：<Pending /></li>
              <li>处理时限：<Pending /></li>
            </ul>
          </section>
        </article>

        <footer className="legal-footer">
          <p>
            请同时阅读 <Link href="/legal/privacy">《隐私协议》</Link>。
          </p>
          <p>
            <Link href="/login">返回登录</Link>
            <span>·</span>
            <Link href="/register">返回注册</Link>
          </p>
        </footer>
      </main>
    </>
  );
}
