import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隐私协议 · 衣橱镜像",
  description: "衣橱镜像隐私协议草案：数据收集、用途、保存期限、跨境传输与用户权利。",
};

function Pending() {
  return <mark className="legal-pending">待补充</mark>;
}

export default function PrivacyPage() {
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

        <h1>隐私协议</h1>
        <p className="legal-meta">
          版本：v0.4 草案 ｜ 生效日期：<Pending /> ｜ 更新日期：<Pending />
        </p>

        <div className="legal-notice" role="note">
          本协议目前为草案。文中标记为「待补充」的主体名称、联系方式、生效日期、
          备案信息与部分第三方处理信息，需在正式上线前补齐并完成法务确认；补齐前
          本协议不构成最终法律文件。
        </div>

        <nav className="legal-toc" aria-label="隐私协议目录">
          <strong>本页目录</strong>
          <ol>
            <li><a href="#scope">引言与适用范围</a></li>
            <li><a href="#operator">运营主体与联系方式</a></li>
            <li><a href="#storage">服务器位置、数据存储与跨境传输</a></li>
            <li><a href="#data">我们收集哪些数据</a></li>
            <li><a href="#purpose">收集目的与使用方式</a></li>
            <li><a href="#third-party">AI 与第三方处理</a></li>
            <li><a href="#retention">保存期限</a></li>
            <li><a href="#rights">用户权利与操作路径</a></li>
            <li><a href="#security">数据安全</a></li>
            <li><a href="#updates">协议更新与生效</a></li>
            <li><a href="#filing">备案与合规说明</a></li>
            <li><a href="#contact">联系我们</a></li>
          </ol>
        </nav>

        <article className="legal-body">
          <section className="legal-section" id="scope">
            <h2>1. 引言与适用范围</h2>
            <p>
              本隐私协议说明衣橱镜像（以下简称“本服务”）如何收集、使用、存储、
              传输和保护与用户相关的数据。本协议适用于访问本服务、注册账号、建立
              衣物档案、生成或扫描标签、以及使用 AI 衣物识别功能的用户。
            </p>
            <p>
              本协议与《用户协议》共同适用；如两份文件对同一事项的表述不一致，
              以专门针对个人信息保护的条款为准，但具体冲突处理规则仍待法务确认
              （<Pending />）。
            </p>
          </section>

          <section className="legal-section" id="operator">
            <h2>2. 运营主体与联系方式</h2>
            <ul>
              <li>运营主体全称：<Pending /></li>
              <li>注册地址 / 联系地址：<Pending /></li>
              <li>联系邮箱：<Pending /></li>
              <li>个人信息保护负责人：<Pending /></li>
              <li>响应时限：<Pending /></li>
            </ul>
            <p>
              上述信息是协议生效与用户行使权利的必要信息；在补齐前，涉及主体身份
              与联系方式的请求暂无法正式受理。
            </p>
          </section>

          <section className="legal-section" id="storage">
            <h2>3. 服务器位置、数据存储与跨境传输</h2>
            <p>
              <strong>本项目服务器位于香港，用户数据存储于香港。</strong>
              由于本服务可能面向中国内地用户，注册、登录、上传衣物照片、使用 AI
              识别或扫码记录等操作，可能构成用户数据向香港的跨境传输。
            </p>
            <p>
              跨境传输涉及的具体合规安排、数据出境安全评估或标准合同等事项：
              <Pending />。相关安排明确前，以本页标注的待补充信息为准。
            </p>
            <p>
              备案信息：<Pending />。本项目服务器位于香港，不涉及境内 ICP 备案；
              如未来在境内提供服务或调整部署地，相关安排以届时更新版本为准。
            </p>
          </section>

          <section className="legal-section" id="data">
            <h2>4. 我们收集哪些数据</h2>
            <ul>
              <li>
                <strong>账号数据：</strong>邮箱、密码哈希（不保存明文密码）、
                登录会话 cookie、注册与登录时间。
              </li>
              <li>
                <strong>衣物档案：</strong>衣物照片（服务端压缩后的图片）、名称、
                类别、颜色、图案、版型、季节、风格、材质、价格、购买日期、备注、
                当前状态。
              </li>
              <li>
                <strong>记录与标签：</strong>穿着、洗涤、收纳、出售等事件记录；
                标签 token；扫码动作的时间与类型。
              </li>
              <li>
                <strong>AI 识别输入：</strong>压缩后的衣物照片会发送给视觉模型
                服务商；原图不入库，只保存压缩图。
              </li>
              <li>
                <strong>技术与安全数据：</strong>用于限流的 IP 地址、错误日志、
                请求时间等运行信息。当前不接入第三方统计或 Cookie 分析脚本。
              </li>
            </ul>
            <p>
              本服务不要求用户提供身份证号、银行卡号、精确位置等敏感个人信息；
              请勿在照片或备注中上传不必要展示给他人的敏感信息。
            </p>
          </section>

          <section className="legal-section" id="purpose">
            <h2>5. 收集目的与使用方式</h2>
            <ul>
              <li>创建与验证账号，维持登录会话。</li>
              <li>建立、展示、编辑、删除衣物档案与事件时间线。</li>
              <li>调用视觉模型生成衣物属性建议，由用户确认后入库。</li>
              <li>生成 A4 标签图片；通过标签 token 记录扫码动作。</li>
              <li>计算首页展示的穿着次数、在柜数量与单次穿着成本。</li>
              <li>进行登录失败与扫码动作限流、故障排查和安全防护。</li>
            </ul>
            <p>
              本服务当前不将用户数据用于出售、广告画像或与衣柜管理无关的营销；
              用途变更时，以更新后的协议为准（见第 10 节）。
            </p>
          </section>

          <section className="legal-section" id="third-party">
            <h2>6. AI 与第三方处理</h2>
            <ul>
              <li>
                <strong>视觉模型服务：</strong>使用火山方舟（Ark）的视觉模型
                处理压缩后的衣物照片，以生成类别、颜色、图案、版型、季节、风格、
                材质建议。图片与提示词会发送至该服务商。
              </li>
              <li>
                <strong>第三方数据地域与保留：</strong>模型服务商处理数据的具体
                地域、保存期限、是否用于模型训练及其他数据处理条款：<Pending />。
              </li>
              <li>
                <strong>托管与基础设施：</strong>服务器、域名、证书及备份服务商
                的名称与数据处理安排：<Pending />。
              </li>
              <li>
                <strong>共享原则：</strong>除为提供服务所必需、取得用户同意或
                法律另有要求外，本服务当前不与第三方共享用户数据；具体共享清单
                与法律披露流程：<Pending />。
              </li>
            </ul>
          </section>

          <section className="legal-section" id="retention">
            <h2>7. 保存期限</h2>
            <ul>
              <li>
                账号与衣物档案：在账号存续期间保存；用户删除单件衣物后，该衣物的
                记录、标签与照片文件会被删除。
              </li>
              <li>
                临时上传图片：未用于建档的临时文件在 24 小时后，由后续上传触发
                清理。
              </li>
              <li>登录会话：30 天；退出登录会清除浏览器 cookie。</li>
              <li>
                登录失败与扫码限流计数：仅保存在服务进程内存中，重启后清零。
              </li>
              <li>
                服务器运行日志、备份、AI 服务商侧数据及其他依法需要保留的数据：
                <Pending />。
              </li>
            </ul>
            <p>
              账号删除后的数据清理范围、备份保留期限与不可恢复时间：
              <Pending />。删除操作完成后，部分备份或日志可能在上方待补充的期限
              内继续保留。
            </p>
          </section>

          <section className="legal-section" id="rights">
            <h2>8. 用户权利与操作路径</h2>
            <ul>
              <li>
                <strong>查询：</strong>登录后可在“我的衣柜”、衣物详情与事件
                时间线中查看已保存的数据。
              </li>
              <li>
                <strong>更正：</strong>在衣物详情页使用“编辑”修改名称、类别、
                颜色、图案、版型、季节、风格、材质、价格、购买日期与备注。
              </li>
              <li>
                <strong>删除单件：</strong>在衣物详情页使用“删除”；删除后该衣物
                的事件、标签与照片文件一并删除。
              </li>
              <li>
                <strong>导出：</strong>当前未提供自助导出功能；请联系
                <Pending /> 提出导出申请。
              </li>
              <li>
                <strong>删除账号：</strong>当前未提供自助注销功能；请联系
                <Pending /> 提出账号删除申请。
              </li>
              <li>
                <strong>撤回同意：</strong>可联系 <Pending /> 撤回；撤回后可能
                无法继续使用依赖相应数据的服务。
              </li>
            </ul>
            <p>
              身份核验方式、处理时限、申请材料与无法满足请求时的说明：
              <Pending />。部分权利可能受适用法律限制，具体以法务确认文本为准。
            </p>
          </section>

          <section className="legal-section" id="security">
            <h2>9. 数据安全</h2>
            <p>
              本服务当前采取的措施包括：密码使用 Node.js 内置 scrypt 哈希；
              登录使用 HMAC 签名的 HttpOnly、SameSite=Lax cookie；衣物查询与
              修改按用户归属校验；上传仅接受 JPG/PNG 且限制 10MB，并在服务端
              压缩后保存；扫码与登录动作有限流。
            </p>
            <p>
              任何系统都无法保证绝对安全。安全事件处置流程、通知方式与责任安排：
              <Pending />。请勿在公开渠道传播自己的标签 token 或账号密码。
            </p>
          </section>

          <section className="legal-section" id="updates">
            <h2>10. 协议更新与生效</h2>
            <p>
              本协议在本页标注版本、更新日期与生效日期。重大变更的
              通知方式、用户重新确认方式：<Pending />。生效日期：<Pending />。
            </p>
          </section>

          <section className="legal-section" id="filing">
            <h2>11. 备案与合规说明</h2>
            <p>
              备案信息：<Pending />。本项目服务器位于香港，当前部署方案不涉及
              境内 ICP 备案；如未来在境内提供服务或调整部署地，相关安排以届时
              更新版本为准。
            </p>
            <p>
              其他与数据跨境、网络安全或个人信息保护相关的审批、评估或登记信息：
              <Pending />。
            </p>
          </section>

          <section className="legal-section" id="contact">
            <h2>12. 联系我们</h2>
            <ul>
              <li>运营主体：<Pending /></li>
              <li>联系邮箱：<Pending /></li>
              <li>联系地址：<Pending /></li>
              <li>投诉与举报渠道：<Pending /></li>
              <li>处理时限：<Pending /></li>
            </ul>
            <p>
              与隐私相关的问题、查询、删除、导出或投诉，请通过上述邮箱联系；
              在主体信息补齐前，本页暂无法提供有效的正式联系渠道。
            </p>
          </section>
        </article>

        <footer className="legal-footer">
          <p>
            继续前请阅读 <Link href="/legal/terms">《用户协议》</Link>。
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
