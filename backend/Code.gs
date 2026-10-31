/**
 * AkiSpot 回答収集・管理ダッシュボード v2026.10-r10
 * 新規のスタンドアロン Google Apps Script プロジェクトに貼り付ける。
 * 初期設定: エディターで setup_ を実行（公開Webページからは呼び出せない非公開関数）。
 * 公開API: doGet, submitSurvey のみ。回答閲覧APIは用意しない。
 * この仕組みは市場調査であり、決済・個人認証・補償の実装ではありません。
 * 管理用スプレッドシートは公開しない。SNSにURLを投稿する前に学生・研究者の運用責任を確認。
 */
const SURVEY_VERSION='2026.10-r10';
const SPREADSHEET_KEY='AKISPOT_R9_SHEET_ID';
const RESPONSES_TITLE = 'AkiSpot アンケート回答・集計（r10）';
const RESPONSE_COLUMNS = ["Q0","Q1","Q2","Q4","Q5","Q6","Q7","Q8","Q9_1","Q9_2","Q9_3","Q9_4","Q10","Q11","Q11b","Q12","Q13","Q13a","Q14","Q14a","Q15","Q15a","Q16","Q17_1","Q17_2","Q17_3","Q17_4","Q18","Q19","Q19b","Q20","Q21","Q21a","Q21b","Q21c","Q21d","Q25","Q22","Q23","Q6a","Q6b","Q13b","Q14b","Q14c","Q21e"];
const QUESTION_METADATA = [["Q0","お住まいの地域を大まかに教えてください","単一選択"],["Q1","年代を教えてください","単一選択"],["Q2","現在のお住まいを教えてください","単一選択"],["Q4","あなたに当てはまるものを選んでください","単一選択"],["Q5","置き場所に困っているモノを選んでください","複数選択"],["Q6","置き場所に困っている荷物の量はどのくらいですか","単一選択"],["Q7","トランクルームなど、荷物の保管サービスを使ったことはありますか","単一選択"],["Q8","検討したものの利用しなかった理由を選んでください","複数選択"],["Q9_1","知らない個人の家に荷物を預ける際、どの程度気になりますか／保管する相手や場所を信頼できるか","1〜5段階評価・判断できない"],["Q9_2","知らない個人の家に荷物を預ける際、どの程度気になりますか／破損・紛失した場合の責任や補償","1〜5段階評価・判断できない"],["Q9_3","知らない個人の家に荷物を預ける際、どの程度気になりますか／荷物を勝手に開封されないか","1〜5段階評価・判断できない"],["Q9_4","知らない個人の家に荷物を預ける際、どの程度気になりますか／約束した時期に確実に返却されるか","1〜5段階評価・判断できない"],["Q10","預けるとき、特に重要だと思う仕組みを最大3つ選んでください","複数選択"],["Q11","3か月保管する場合、保管料だけなら月額いくらまで払えますか","単一選択"],["Q11b","月8,260円（送料別）で3か月保管できる場合、利用を検討しますか","単一選択"],["Q12","3か月の保管で、往復の送料・運搬費を合計いくらまで負担できますか","単一選択"],["Q13","今後3か月以内に、有料の保管場所を探す可能性はありますか","単一選択"],["Q13a","荷物を運ぶとしたら、利用できそうな方法はどれですか","単一選択"],["Q14","利用していない、または余裕のあるスペースを選んでください","複数選択"],["Q14a","荷物を置くために使えそうな広さはどのくらいですか","単一選択"],["Q15","そのスペースは現在どのような状態ですか","単一選択"],["Q15a","その場所で他人の荷物を預かるには、誰の確認が必要ですか","単一選択"],["Q16","他人の荷物を預かり、報酬を得ることにどの程度関心がありますか","1〜5段階評価・判断できない"],["Q17_1","知らない人の荷物を預かる際、どの程度気になりますか／危険物や禁止物が混ざっていないか","1〜5段階評価・判断できない"],["Q17_2","知らない人の荷物を預かる際、どの程度気になりますか／破損・紛失を疑われたときの責任","1〜5段階評価・判断できない"],["Q17_3","知らない人の荷物を預かる際、どの程度気になりますか／返却期限を過ぎても引き取られないこと","1〜5段階評価・判断できない"],["Q17_4","知らない人の荷物を預かる際、どの程度気になりますか／住所の公開や受取・保管・返却の手間","1〜5段階評価・判断できない"],["Q18","預かるとき、特に重要だと思う仕組みを最大3つ選んでください","複数選択"],["Q19","段ボール約10箱を3か月預かる場合、月額の受取希望額は？","単一選択"],["Q19b","月7,000円の報酬で段ボール約10箱を3か月預かる場合、引き受けますか","単一選択"],["Q20","預かりたくない荷物を選んでください","複数選択"],["Q21","最長どれくらいの期間なら預かれますか","単一選択"],["Q21a","同時に何組程度の荷物を受け入れられそうですか","単一選択"],["Q21b","荷物を受け取るなら、どの方法に対応できますか","単一選択"],["Q21c","現在のお住まいは「70歳以上の方だけで暮らす世帯」ですか","単一選択"],["Q21d","今後3か月以内に、他人の荷物を受け入れる準備ができそうですか","単一選択"],["Q25","現在は必要がなくても、今後AkiSpotを検討する可能性はありますか","単一選択"],["Q22","利用するとしたら、何が一番気になりますか（任意）","任意自由記述"],["Q23","利用を考えられる条件があれば教えてください（任意）","任意自由記述"],["Q6a","希望する保管期間はどれくらいですか","単一選択"],["Q6b","保管期間中、荷物を途中で取り出す頻度はどの程度になりそうですか","単一選択"],["Q13b","自分で荷物を持ち込む場合、許容できる片道距離はどれくらいですか","単一選択"],["Q14b","主に使えそうな保管場所の環境を選んでください","単一選択"],["Q14c","その場所で段ボール箱を何箱程度預かれそうですか","単一選択"],["Q21e","預かった荷物を借り手が途中で取り出す場合、どの程度対応できますか","単一選択"]];
const QUESTION_SCHEMA = {"Q0":{"type":"single","choices":["京都市内","京都府内（京都市以外）","大阪府内","滋賀・奈良・兵庫・和歌山県","その他","回答しない"],"optional":true},"Q1":{"type":"single","choices":["10代","20代","30代","40代","50代","60代","70代以上","回答しない"]},"Q2":{"type":"single","choices":["ワンルーム・1K","1DK・1LDK","2K・2DK・2LDK","3LDK以上の集合住宅","一戸建て","学生寮・シェアハウス","その他","回答しない"],"other":true},"Q4":{"type":"single","choices":["置き場所に困っている荷物がある（預ける側）","使っていないスペースがある（預かる側）","両方当てはまる","どちらも当てはまらない"]},"Q5":{"type":"multi","choices":["思い出の品・記念品","季節用品（暖房・扇風機など）","趣味の道具（スポーツ用品・楽器など）","本・書類","衣類","家具・家電","その他"],"other":true},"Q6":{"type":"single","choices":["段ボール1〜2箱程度","段ボール3〜5箱程度","段ボール6〜10箱程度","段ボール11箱以上","家具・家電など箱に入らない物がある","まだ分からない"]},"Q6a":{"type":"single","choices":["1か月未満","1〜3か月","4〜6か月","7〜12か月","1年を超える","まだ分からない"]},"Q6b":{"type":"single","choices":["期間中は取り出さない","月1回未満","月1回程度","月2回以上","まだ分からない"]},"Q7":{"type":"single","choices":["現在利用している","以前利用した","検討したが利用しなかった","検討したことはない","サービス自体を知らなかった"]},"Q8":{"type":"multi","choices":["料金が高かった","契約手続きが面倒だった","近くに施設がなかった","必要な広さ・期間のプランがなかった","運搬や配送が大変だった","比較・探すのが面倒だった","その他"],"other":true},"Q9":{"type":"matrix","rows":["保管する相手や場所を信頼できるか","破損・紛失した場合の責任や補償","荷物を勝手に開封されないか","約束した時期に確実に返却されるか"]},"Q10":{"type":"multi","choices":["本人確認が済んだ相手のみ利用できる","保管場所の写真・環境が分かる","破損・紛失時の補償と責任分担が明確","運営が料金や返金を管理する","荷物の状態を確認できる","宅配・対面など受渡し方法を選べる","特に必要と思うものはない"],"maxSelect":3,"exclusive":["特に必要と思うものはない"]},"Q11":{"type":"single","choices":["月1,000円以下","月1,001〜3,000円","月3,001〜5,000円","月5,001〜7,000円","月7,001〜10,000円","月10,001円以上","いくらでも預けたくない"]},"Q11b":{"type":"single","choices":["この条件なら利用したい","条件が合えば利用を検討したい","この条件では利用したくない","保管環境・補償・送料などが不明で判断できない"]},"Q12":{"type":"single","choices":["追加の運搬費は負担したくない","1〜3,999円","4,000〜7,999円","8,000〜14,999円","15,000〜29,999円","30,000円以上","荷物や方法による・分からない"]},"Q13":{"type":"single","choices":["すでに探している","探す可能性が高い","必要になれば探す","今は探す予定がない","分からない"]},"Q13a":{"type":"single","choices":["自分で持ち込む","宅配便で送る","集荷・運搬まで依頼したい","方法は問わない","どの方法も難しい・分からない"]},"Q13b":{"type":"single","choices":["1km未満","1〜3km未満","3〜5km未満","5〜10km未満","10km以上","自分では運べない・配送を利用する","まだ分からない"]},"Q14":{"type":"multi","choices":["押入れ・クローゼットの一部","押入れ・クローゼット1つ分","部屋の一角","使っていない部屋","自宅の倉庫・物置","ガレージ","店舗・事業所内のスペース","その他"],"other":true},"Q14a":{"type":"single","choices":["0.5畳未満","0.5畳〜1畳未満","1畳〜2畳未満","2畳以上","分からない"]},"Q14b":{"type":"single","choices":["屋内で施錠できる","屋内だが施錠できない","屋根のある倉庫・物置","ガレージなど外気の影響を受けやすい場所","複数の環境がある","まだ分からない"]},"Q14c":{"type":"single","choices":["1〜2箱","3〜5箱","6〜10箱","11箱以上","箱数では表しにくい大型品向け","まだ分からない"]},"Q15":{"type":"single","choices":["ほぼ空いていてすぐ使える","使わない物を移せば使える","時々使うので条件次第","すぐには空けられない"]},"Q15a":{"type":"single","choices":["自分の判断で利用できる","家族・同居人に確認が必要","家主・管理会社などの許可が必要","許可が得られない・禁止されている","分からない"]},"Q16":{"type":"rating"},"Q17":{"type":"matrix","rows":["危険物や禁止物が混ざっていないか","破損・紛失を疑われたときの責任","返却期限を過ぎても引き取られないこと","住所の公開や受取・保管・返却の手間"]},"Q18":{"type":"multi","choices":["借り手の本人確認","荷物の写真・大きさ・種類の事前申告","受け入れない荷物を指定できる","補償範囲・責任分担が明確","返却遅延時に運営が調整する","取引成立まで住所を公開しない","特に必要と思うものはない"],"maxSelect":3,"exclusive":["特に必要と思うものはない"]},"Q19":{"type":"single","choices":["月1,000円以下","月1,001〜3,000円","月3,001〜5,000円","月5,001〜7,000円","月7,001〜10,000円","月10,001円以上","いくらでも預かりたくない"]},"Q19b":{"type":"single","choices":["この条件なら預かりたい","条件が合えば預かることを検討したい","この条件では預かりたくない","補償・保管条件などが不明で判断できない"]},"Q20":{"type":"multi","choices":["高額な物・壊れやすい物","大型家具・家電","臭いの強い物","中身が確認できない箱","重量物","特にない","その他"],"other":true,"exclusive":["特にない"]},"Q21":{"type":"single","choices":["1か月まで","3か月まで","6か月まで","1年まで","1年を超えてもよい","期間は条件次第"]},"Q21a":{"type":"single","choices":["1組","2組","3組以上","種類や大きさによる","分からない"]},"Q21b":{"type":"single","choices":["宅配便での受取","対面での受取","両方対応できる","どちらも難しい・分からない"]},"Q21e":{"type":"single","choices":["日程調整すれば月2回以上でも対応できる","月1回程度なら対応できる","原則として預入時と返却時だけ","途中の出し入れには対応できない","まだ分からない"]},"Q21c":{"type":"single","choices":["はい","いいえ","回答しない"],"optional":true},"Q21d":{"type":"single","choices":["すでに受け入れの準備ができている","片付けや必要な確認が済めば可能","関心はあるが当面は難しい","預かるつもりはない","分からない"]},"Q25":{"type":"single","choices":["荷物を預けることを検討するかもしれない","スペースを提供することを検討するかもしれない","両方の立場を検討するかもしれない","どちらも利用する予定はない","分からない"]},"Q22":{"type":"text","optional":true},"Q23":{"type":"text","optional":true}};
const COMMON_IDS = ["Q0","Q1","Q2","Q4"];
const BORROW_IDS = ["Q5","Q6","Q6a","Q6b","Q7","Q8","Q9","Q10","Q11","Q11b","Q12","Q13","Q13a","Q13b"];
const LEND_IDS = ["Q14","Q14a","Q14b","Q14c","Q15","Q15a","Q16","Q17","Q18","Q19","Q19b","Q20","Q21","Q21a","Q21b","Q21e","Q21c","Q21d"];
const FINAL_IDS = ["Q25","Q22","Q23"];

// カラム名の変更は集計互換性に影響する。既存名を変更せず新列を追加すること。
const FLAG_COLUMNS = [
 '借り手フラグ','貸し手フラグ','借り手_価格前向き','借り手_価格明確','借り手_3か月探索',
 '借り手_有望候補','貸し手_価格前向き','貸し手_価格明確','貸し手_3か月受入準備',
 '貸し手_本人判断で使用可','貸し手_有望候補','貸し手_条件付き候補'
];
const META_COLUMNS=['回答日時','調査版','受付番号',...RESPONSE_COLUMNS,...FLAG_COLUMNS,'回答ID'];
const ROLE_B='置き場所に困っている荷物がある（預ける側）';
const ROLE_L='使っていないスペースがある（預かる側）';
const ROLE_BOTH='両方当てはまる';
const ROLE_NONE='どちらも当てはまらない';

/** Google Apps Script エディターの関数選択で setup_ を一度実行。複数回実行しても回答を削除しない。 */
function setup_() {
  const props=PropertiesService.getScriptProperties();
  let id=props.getProperty(SPREADSHEET_KEY);
  if (!id) {
    const ss=SpreadsheetApp.create(RESPONSES_TITLE);
    id=ss.getId();
    props.setProperty(SPREADSHEET_KEY,id);
    ss.getSheets()[0].setName('回答');
  }
  const ss=SpreadsheetApp.openById(id);
  const raw=getOrCreateSheet_(ss,'回答');
  ensureResponseColumns_(raw);
  styleRaw_(raw);
  writeDefinitions_(ss);
  writeAggregate_(ss);
  writeDashboard_(ss);
  writeGuide_(ss);
  ss.setActiveSheet(ss.getSheetByName('ダッシュボード'));
  SpreadsheetApp.flush();
  console.log('回答・集計シート: '+ss.getUrl());
  return ss.getUrl();
}
function getOrCreateSheet_(ss,name){return ss.getSheetByName(name)||ss.insertSheet(name);}
function ensureResponseColumns_(sheet) {
  const initial=sheet.getLastColumn();
  if(initial===0) sheet.getRange(1,1,1,3).setValues([['回答日時','調査版','受付番号']]);
  const existing=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  const extra=META_COLUMNS.filter(name=>!existing.includes(name));
  const capacity=sheet.getMaxColumns();
  if(existing.length+extra.length>capacity)sheet.insertColumnsAfter(capacity,existing.length+extra.length-capacity);
  extra.forEach(name=>{sheet.getRange(1,existing.length+1).setValue(name);existing.push(name);});
  const mapping={};existing.forEach((v,i)=>{mapping[v]=i;});
  return {mapping,columnCount:existing.length};
}
function colLetter_(n){let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
function sheetCol_(headers,name){return "'回答'!$"+colLetter_(headers.mapping[name]+1)+'$2:$'+colLetter_(headers.mapping[name]+1);}
function styleRaw_(sh) {
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,sh.getLastColumn()).setBackground('#194e39').setFontColor('#ffffff').setFontWeight('bold');
  sh.getRange('A:A').setNumberFormat('yyyy/mm/dd hh:mm');
  sh.setColumnWidth(1,148); sh.setColumnWidth(2,122);sh.setColumnWidth(3,135);
}
function writeDefinitions_(ss) {
  const sh=getOrCreateSheet_(ss,'設問定義');if(sh.getLastRow()&&sh.getLastColumn())sh.getDataRange().breakApart();sh.clear();
  const values=[['列名','質問文・内容','回答形式'],...QUESTION_METADATA];
  sh.getRange(1,1,values.length,3).setValues(values);
  sh.getRange(1,1,1,3).setFontWeight('bold').setBackground('#194e39').setFontColor('#ffffff');
  sh.setFrozenRows(1);sh.setColumnWidths(1,1,120);sh.setColumnWidth(2,600);sh.setColumnWidth(3,155);
}
function buildFlags_(a) {
  const b=a.Q4===ROLE_B || a.Q4===ROLE_BOTH;
  const l=a.Q4===ROLE_L || a.Q4===ROLE_BOTH;
  const bPrice=b && ['この条件なら利用したい','条件が合えば利用を検討したい'].includes(a.Q11b);
  const bStrong=b && a.Q11b==='この条件なら利用したい';
  const bSoon=b && ['すでに探している','探す可能性が高い'].includes(a.Q13);
  const lPrice=l && ['この条件なら預かりたい','条件が合えば預かることを検討したい'].includes(a.Q19b);
  const lStrong=l && a.Q19b==='この条件なら預かりたい';
  const lSoon=l && ['すでに受け入れの準備ができている','片付けや必要な確認が済めば可能'].includes(a.Q21d);
  const lOwn=l && a.Q15a==='自分の判断で利用できる';
  const lArea=l && ['0.5畳〜1畳未満','1畳〜2畳未満','2畳以上'].includes(a.Q14a);
  const lTransfer=l && ['宅配便での受取','対面での受取','両方対応できる'].includes(a.Q21b);
  const lDuration=l && ['3か月まで','6か月まで','1年まで','1年を超えてもよい','期間は条件次第'].includes(a.Q21);
  const lPerm=l && ['自分の判断で利用できる','家族・同居人に確認が必要','家主・管理会社などの許可が必要'].includes(a.Q15a);
  const lExclude=l && a.Q21c==='はい'; // 70歳以上のみ世帯（参考集計条件）
  return {
    '借り手フラグ':+(b),'貸し手フラグ':+(l),
    '借り手_価格前向き':+(bPrice),'借り手_価格明確':+(bStrong),
    '借り手_3か月探索':+(bSoon),'借り手_有望候補':+(bStrong&&bSoon&&a.Q13a!=='どの方法も難しい・分からない'&&a.Q6a!=='まだ分からない'),
    '貸し手_価格前向き':+(lPrice),'貸し手_価格明確':+(lStrong),
    '貸し手_3か月受入準備':+(lSoon),'貸し手_本人判断で使用可':+(lOwn),
    '貸し手_有望候補':+(lStrong&&lOwn&&a.Q21d==='すでに受け入れの準備ができている'&&lArea&&lTransfer&&lDuration&&!lExclude),
    '貸し手_条件付き候補':+(lPrice&&lSoon&&lPerm&&lArea&&lTransfer&&lDuration&&!lExclude)
  };
}
function populateCells_(a,layout,row) {
  RESPONSE_COLUMNS.forEach(k=>{
    const match=/^(Q\d+[a-z]?)_(\d+)$/.exec(k);
    const raw=match?(a[match[1]]||{})[Number(match[2])-1]:a[k];
    const v=raw===undefined||raw===null?'':raw;
    const rating=match||k==='Q16';
    row[layout.mapping[k]]=rating && v!=='' && Number.isFinite(Number(v)) ? Number(v) : cleanCell_(v);
  });
  const flags=buildFlags_(a);FLAG_COLUMNS.forEach(k=>{row[layout.mapping[k]]=flags[k];});
}
function writeAggregate_(ss) {
  const sh=getOrCreateSheet_(ss,'集計');if(sh.getLastRow()&&sh.getLastColumn())sh.getDataRange().breakApart();sh.clear();
  const raw=ss.getSheetByName('回答'),m=ensureResponseColumns_(raw);
  const ref=n=>sheetCol_(m,n);
  const cnt=n=>'=COUNTIF('+ref(n)+',1)';
  const countRaw='=COUNTA('+ref('回答ID')+')';
  sh.getRange('A1').setValue('AkiSpot｜回答集計（新着回答は自動反映）');
  sh.getRange('A2').setValue('※調査協力者内の集計です。「判断できない」（0）は5段階評価の平均から除外します。成約見込みではありません。');
  sh.getRange('A4:D4').setValues([['集計指標','件数','割合・参考','判定条件／注意']]);
  const metrics=[
    ['回答数',countRaw,'','重複回答IDは保存時に防止。ただし別IDでの再回答・なりすましは防げません。'],
    ['借り手に該当',cnt('借り手フラグ'),'=IFERROR(B6/B5,0)','両方を選んだ人も含む'],
    ['貸し手に該当',cnt('貸し手フラグ'),'=IFERROR(B7/B5,0)','両方を選んだ人も含む'],
    ['借り手：価格に前向き',cnt('借り手_価格前向き'),'=IFERROR(B8/B6,0)','月8,260円・送料別。「条件付き」を含む'],
    ['借り手：明確な利用意向',cnt('借り手_価格明確'),'=IFERROR(B9/B6,0)','「利用したい」のみ'],
    ['借り手：3か月以内の探索意向',cnt('借り手_3か月探索'),'=IFERROR(B10/B6,0)','有料保管先をすでに探している・高確率で探す'],
    ['借り手：強めの有望候補',cnt('借り手_有望候補'),'=IFERROR(B11/B6,0)','明確な価格意向 × 探索意向 × 運搬方法あり'],
    ['貸し手：価格に前向き',cnt('貸し手_価格前向き'),'=IFERROR(B12/B7,0)','月7,000円受取。「条件付き」を含む'],
    ['貸し手：明確な受入意向',cnt('貸し手_価格明確'),'=IFERROR(B13/B7,0)','「預かりたい」のみ'],
    ['貸し手：3か月以内の準備可能性',cnt('貸し手_3か月受入準備'),'=IFERROR(B14/B7,0)','現状で準備済み・条件次第で準備可能'],
    ['貸し手：本人判断で使用可能（自己申告）',cnt('貸し手_本人判断で使用可'),'=IFERROR(B15/B7,0)','法律・契約上の適法性は未確認'],
    ['貸し手：強めの有望候補',cnt('貸し手_有望候補'),'=IFERROR(B16/B7,0)','厳格な自己申告条件を満たす人。実地確認前'],
    ['貸し手：条件付き候補',cnt('貸し手_条件付き候補'),'=IFERROR(B17/B7,0)','家族・家主の許可が未取得の人を含む。供給確定数ではない'],
    ['候補人数上の小さい方','=MIN(B11,B16)','','地域・荷物種別・日時等の一致を見ていないため成約予測ではない']
  ];
  sh.getRange(5,1,metrics.length,4).setValues(metrics);
  sh.getRange(6,3,12,1).setNumberFormat('0.0%');
  sh.getRange('A22:D22').setValues([['設問','選択肢','回答数','母数内割合']]);
  const breakdown=[
    ['Q0',QUESTION_SCHEMA.Q0.choices],
    ['Q25',QUESTION_SCHEMA.Q25.choices],
    ['Q1',['10代','20代','30代','40代','50代','60代','70代以上','回答しない']],
    ['Q4',[ROLE_B,ROLE_L,ROLE_BOTH,ROLE_NONE]],
    ['Q11b',QUESTION_SCHEMA.Q11b.choices],
    ['Q19b',QUESTION_SCHEMA.Q19b.choices],
    ['Q11',QUESTION_SCHEMA.Q11.choices],['Q19',QUESTION_SCHEMA.Q19.choices],
    ['Q13',QUESTION_SCHEMA.Q13.choices],['Q6a',QUESTION_SCHEMA.Q6a.choices],['Q13b',QUESTION_SCHEMA.Q13b.choices],['Q14b',QUESTION_SCHEMA.Q14b.choices],['Q14c',QUESTION_SCHEMA.Q14c.choices],['Q21e',QUESTION_SCHEMA.Q21e.choices],['Q15a',QUESTION_SCHEMA.Q15a.choices],
    ['Q21d',QUESTION_SCHEMA.Q21d.choices],['Q10',QUESTION_SCHEMA.Q10.choices],['Q18',QUESTION_SCHEMA.Q18.choices]
  ];
  const breakdownRows=[];
  breakdown.forEach(([id,opts])=>{
    opts.forEach(opt=>{
      const f=(id==='Q10'||id==='Q18')?'=COUNTIF('+ref(id)+','+JSON.stringify('*'+opt+'*')+')':'=COUNTIF('+ref(id)+','+JSON.stringify(opt)+')';
      const denominator=(['Q11b','Q11','Q13','Q10','Q6a','Q13b'].includes(id))?'$B$6':(['Q19b','Q19','Q15a','Q21d','Q18','Q14b','Q14c','Q21e'].includes(id))?'$B$7':'$B$5';
      breakdownRows.push([id,opt,f,'=IFERROR(C'+(23+breakdownRows.length)+'/'+denominator+',0)']);
    });
  });
  if(breakdownRows.length)sh.getRange(23,1,breakdownRows.length,4).setValues(breakdownRows).offset(0,3,breakdownRows.length,1).setNumberFormat('0.0%');
  const rates=['Q9','Q17'];
  const begin=26+breakdownRows.length;
  sh.getRange(begin,1,1,4).setValues([['不安・機能評価','対象項目','平均値（1〜5）','回答件数']]);
  let rateRows=[];
  rates.forEach(q=>QUESTION_SCHEMA[q].rows.forEach((row,i)=>{
    const column=q+'_'+(i+1),cell=ref(column);
    rateRows.push([q,row,'=IFERROR(AVERAGEIF('+cell+',">0"),"")','=COUNTIF('+cell+',">0")']);
  }));
  const interestCol=ref('Q16');
  rateRows.push(['Q16','他人の荷物を預かって収入を得ることへの関心','=IFERROR(AVERAGEIF('+interestCol+',">0"),"")','=COUNTIF('+interestCol+',">0")']);
  sh.getRange(begin+1,1,rateRows.length,4).setValues(rateRows);
  sh.getRange('A1:D1').merge().setFontSize(17).setFontWeight('bold').setFontColor('#194e39');
  sh.getRange('A2:D2').merge().setFontColor('#a35520').setWrap(true);
  [4,22,begin].forEach(r=>sh.getRange(r,1,1,4).setBackground('#194e39').setFontColor('#fff').setFontWeight('bold'));
  sh.getRange(5,2,metrics.length,1).setNumberFormat('0');
  sh.setFrozenRows(4); sh.setColumnWidths(1,1,245);sh.setColumnWidth(2,365);sh.setColumnWidth(3,148);sh.setColumnWidth(4,420);
  sh.getRange(5,4,metrics.length,1).setWrap(true);
  return {breakdownRows,breakdownStart:23,rateStart:begin+1};
}
function writeDashboard_(ss) {
  const sh=getOrCreateSheet_(ss,'ダッシュボード');if(sh.getLastRow()&&sh.getLastColumn())sh.getDataRange().breakApart();sh.clear();
  sh.getCharts().forEach(c=>sh.removeChart(c));
  sh.setHiddenGridlines(true);
  sh.setColumnWidths(1,1,210); sh.setColumnWidths(2,1,150); sh.setColumnWidths(3,1,28);
  sh.setColumnWidths(4,1,220); sh.setColumnWidths(5,1,145);sh.setColumnWidths(6,1,30);
  sh.setColumnWidths(7,1,220); sh.setColumnWidths(8,1,145);
  sh.getRange('A1:H2').merge().setValue('AkiSpot｜アンケート管理ダッシュボード')
    .setBackground('#194e39').setFontColor('#fff').setFontSize(20).setFontWeight('bold').setVerticalAlignment('middle');
  sh.setRowHeights(1,2,27);
  sh.getRange('A4:H4').merge().setValue('更新：回答が保存されると集計式に反映されます。新しい回答を確認するには再読み込みしてください。')
    .setFontColor('#355b46');
  const blocks=[
    ['A6','B6','総回答数','=集計!B5'],['D6','E6','借り手回答者','=集計!B6'],['G6','H6','貸し手回答者','=集計!B7'],
    ['A9','B9','借り手・価格前向き','=集計!B8'],['D9','E9','借り手・強め候補','=集計!B11'],['G9','H9','貸し手・強め候補','=集計!B16'],
    ['A12','B12','貸し手・条件付き候補','=集計!B17'],['D12','E12','人数上の小さい方（参考）','=集計!B18']
  ];
  blocks.forEach(([a,b,t,v])=>{
    sh.getRange(a).setValue(t).setFontWeight('bold').setWrap(true).setFontColor('#194e39').setBackground('#e6f3e9');
    sh.getRange(b).setFormula(v).setFontSize(22).setFontWeight('bold').setFontColor('#194e39').setBackground('#f4faf5').setNumberFormat('0');
    sh.getRange(a+':'+b).setBorder(true,true,true,true,false,false,'#cbded1',SpreadsheetApp.BorderStyle.SOLID);
  });
  sh.getRange('A16:H17').merge().setValue('注意：各人数は自己申告・標本内の指標です。条件付き候補には未許可の場所が含まれます。人数上の小さい方は、地域や荷物条件を照合した成約見込みではありません。')
    .setWrap(true).setBackground('#fff2dd').setFontColor('#7c4d1f');
  sh.getRange('A19:H19').merge().setValue('設問別の分布・5段階評価の平均は「集計」タブで確認できます。氏名・メールアドレスは収集しません。')
    .setWrap(true).setFontColor('#496a57');
  // グラフは集計タブの見やすい固定範囲を使用。0件のときにも表示する。
  const addChart=(range,title,row,col)=>{
    try {
      const ch=sh.newChart().asBarChart().addRange(range).setNumHeaders(1)
        .setOption('title',title).setOption('legend',{position:'none'})
        .setOption('hAxis',{minValue:0}).setPosition(row,col,0,0).build();
      sh.insertChart(ch);
    }catch(err){console.log('チャート作成の警告: '+err);}
  };
  const q4col=sheetCol_(ensureResponseColumns_(ss.getSheetByName('回答')),'Q4');
  sh.getRange('J1:K1').setValues([['立場','件数']]);
  sh.getRange('J2:K5').setValues([
   ['預ける側のみ','=COUNTIF('+q4col+','+JSON.stringify(ROLE_B)+')'],
   ['預かる側のみ','=COUNTIF('+q4col+','+JSON.stringify(ROLE_L)+')'],
   ['両方','=COUNTIF('+q4col+','+JSON.stringify(ROLE_BOTH)+')'],
   ['該当なし','=COUNTIF('+q4col+','+JSON.stringify(ROLE_NONE)+')']
  ]);
  sh.getRange('M1:N1').setValues([['検証指標','人数']]);
  sh.getRange('M2:N7').setValues([
   ['借り手：価格に前向き','=集計!B8'],['借り手：強め候補','=集計!B11'],
   ['貸し手：価格に前向き','=集計!B12'],['貸し手：強め候補','=集計!B16'],
   ['貸し手：条件付き候補','=集計!B17'],['参考・人数上限','=集計!B18']
  ]);
  addChart(sh.getRange('J1:K5'),'立場別の回答数',22,1);
  addChart(sh.getRange('M1:N7'),'利用・受入に関する候補人数',22,5);
  sh.setColumnWidths(10,1,260);sh.setColumnWidth(11,120);sh.setColumnWidth(13,270);sh.setColumnWidth(14,120);
  sh.setFrozenRows(2);
}
function writeGuide_(ss){
  const sh=getOrCreateSheet_(ss,'管理・注意');if(sh.getLastRow()&&sh.getLastColumn())sh.getDataRange().breakApart();sh.clear();
  const lines=[
   ['AkiSpot / 管理者向けガイド','説明'],
   ['回答を見る','「回答」タブに1件1行で追加されます。列はQ1〜Q24と分析フラグです。'],
   ['集計を見る','「ダッシュボード」で主要KPI、「集計」で設問別件数・割合・5段階評価の平均を確認できます。'],
   ['公開範囲','回答ページを公開しても、このスプレッドシートは自動で一般公開されません。Driveで共有設定を変更しないでください。'],
   ['質問対象','Q4で選ばれた立場の設問のみ回答します。Q8はQ7で「検討したが利用しなかった」の場合だけ表示。Q25は全員が回答。'],
   ['重複対策','同一端末・同じ回答IDで送信を再試行しても1行です。ただし別端末・別回答IDの複数回答は防ぎません。'],
   ['結果の解釈','利用意向は自己申告であり、取引成立や地域人口の需要・供給を保証しません。'],
   ['貸し手候補','空きスペースと取引可能な供給量は異なります。「本人判断で利用可能」は法令・契約に基づく確認を意味しません。'],
   ['70歳以上のみ世帯','Q21cの「はい」は貸し手候補の一部集計で除外するための回答です。無回答者は含まれるため厳密な除外ではありません。'],
   ['地域別集計','Q0の大まかな地域は任意です。「集計」タブのQ0から回答者の地域分布を確認できます。郵便番号や住所の一致は判定していません。'],
   ['集計対象','「回答」シートの全ての行を計算します。既存調査を同じシートに移行する場合は列名と回答版の互換性に注意。'],
   ['データの保管','氏名・メールアドレスは質問しませんが、自由記述に個人情報が混じる可能性があります。共有を限定し、不要になったら削除を検討してください。'],
   ['ダウンロード','スプレッドシートの「ファイル」→「ダウンロード」からExcel/CSV形式を保存できます。'],
   ['質問版の変更','r8とは別の公開先を用意するためr10は別の回答シートに保存します。旧回答を自動で混在させないでください。'],
   ['回答版',SURVEY_VERSION],
   ['集計シートURL',ss.getUrl()]
  ];
  sh.getRange(1,1,lines.length,2).setValues(lines).setWrap(true);
  sh.getRange('A1:B1').setBackground('#194e39').setFontColor('#fff').setFontWeight('bold');
  sh.setColumnWidth(1,210);sh.setColumnWidth(2,780);sh.setFrozenRows(1);
}
/** 公開アンケート。結果の閲覧機能は公開しない。 */
function doGet(){
 return HtmlService.createHtmlOutputFromFile('Index').setTitle('AkiSpot｜荷物と空きスペースに関するアンケート')
  .addMetaTag('viewport','width=device-width,initial-scale=1,viewport-fit=cover');
}
function submitSurvey(payload){
 if(!payload||typeof payload!=='object'||!payload.answers||typeof payload.answers!=='object'||Array.isArray(payload.answers))throw new Error('回答データが不正です。');
 if(payload.version!==SURVEY_VERSION)throw new Error('古いアンケートです。配布された最新のURLを開いてください。');
 if(JSON.stringify(payload).length>35000)throw new Error('回答データが大きすぎます。');
 const req=String(payload.requestId||'');
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(req))throw new Error('回答IDが不正です。');
 const a=payload.answers; validateAnswers_(a);
 const id=PropertiesService.getScriptProperties().getProperty(SPREADSHEET_KEY);
 if(!id)throw new Error('回答受付はまだ設定されていません。管理者にお知らせください。');
 const lock=LockService.getScriptLock();lock.waitLock(25000);
 try {
  const sheet=SpreadsheetApp.openById(id).getSheetByName('回答');
  if(!sheet)throw new Error('保存先の回答シートがありません。');
  const m=ensureResponseColumns_(sheet),idIndex=m.mapping['回答ID']+1;
  const lastRow=sheet.getLastRow();
  if(lastRow>1){
   const found=sheet.getRange(2,idIndex,lastRow-1,1).createTextFinder(req).matchEntireCell(true).findNext();
   if(found){const existing=sheet.getRange(found.getRow(),m.mapping['受付番号']+1).getValue();return {ok:true,receipt:String(existing),duplicate:true};}
  }
  const receipt=Utilities.getUuid().slice(0,12);
  const row=Array(m.columnCount).fill('');
  row[m.mapping['回答日時']]=new Date();row[m.mapping['調査版']]=SURVEY_VERSION;row[m.mapping['受付番号']]=receipt;
  populateCells_(a,m,row);row[m.mapping['回答ID']]=req;
  // 1つのシートに1行だけ追記。分析フラグも同じ行に含めることで整合性を維持する。
  sheet.appendRow(row);
  SpreadsheetApp.flush();
  return {ok:true,receipt,duplicate:false};
 }finally{lock.releaseLock();}
}
function validateOne_(id,v,required){
 const q=QUESTION_SCHEMA[id];if(!q)throw new Error('未定義の設問です。');
 if(v===undefined||v===null||v===''){if(required)throw new Error(id+' の回答が不足しています。');return;}
 if(q.type==='text'){if(typeof v!=='string'||v.length>700)throw new Error(id+' の入力が長すぎます。');return;}
 if(q.type==='single'){
  if(typeof v==='string'&&q.choices.includes(v)&&!(q.other&&v==='その他'))return;
  if(q.other&&v&&!Array.isArray(v)&&typeof v==='object'&&v.choice==='その他'&&typeof v.other==='string'&&v.other.trim()&&v.other.length<=160)return;
  throw new Error(id+' の選択肢に問題があります。');
 }
 if(q.type==='multi'){
  if(!v||typeof v!=='object'||Array.isArray(v)||!Array.isArray(v.list))throw new Error(id+' の選択肢が不正です。');
  if(!v.list.length||v.list.length!==new Set(v.list).size||v.list.some(x=>typeof x!=='string'||!q.choices.includes(x)))throw new Error(id+' の選択肢が不正です。');
  if(q.exclusive&&q.exclusive.some(x=>v.list.includes(x))&&v.list.length>1)throw new Error(id+' の排他選択が不正です。');
  if(q.maxSelect&&v.list.length>q.maxSelect)throw new Error(id+' の選択数が上限を超えています。');
  if(v.list.includes('その他')&&(!q.other||typeof v.other!=='string'||!v.other.trim()||v.other.length>160))throw new Error(id+' のその他の記入が不足しています。');
  return;
 }
 if(q.type==='rating'){if(!Number.isInteger(Number(v))||Number(v)<0||Number(v)>5)throw new Error(id+' の評価に問題があります。');return;}
 if(q.type==='matrix'){
  if(!v||Array.isArray(v)||typeof v!=='object'||!q.rows.every((r,i)=>Number.isInteger(Number(v[i]))&&Number(v[i])>=0&&Number(v[i])<=5))throw new Error(id+' の評価に不足があります。');
 }
}
function validateAnswers_(a){
 const role=a.Q4,b=role===ROLE_B||role===ROLE_BOTH,l=role===ROLE_L||role===ROLE_BOTH;
 if(!b&&!l&&role!==ROLE_NONE)throw new Error('回答する立場を選択してください。');
 const active=[...COMMON_IDS,...(b?BORROW_IDS.filter(k=>k!=='Q8'||a.Q7==='検討したが利用しなかった'):[]),...(l?LEND_IDS:[]),...FINAL_IDS];
 const allowed=new Set(active);Object.keys(a).forEach(k=>{if(!allowed.has(k))throw new Error('対象外の設問が含まれています。');});
 active.forEach(k=>validateOne_(k,a[k],!QUESTION_SCHEMA[k].optional));
}
function cleanCell_(v){
 if(v===undefined||v===null)return '';
 let out='';
 if(typeof v==='string'||typeof v==='number')out=String(v);
 else if(v&&typeof v==='object'){
  if(Array.isArray(v.list))out=v.list.map(x=>x==='その他'?'その他：'+(v.other||''):x).join(' / ');
  else if('choice' in v)out=v.choice==='その他'?'その他：'+(v.other||''):v.choice;
 }
 out=out.slice(0,700).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
 // スプレッドシート数式として実行される入力を防止する。
 if(/^[\s]*[=+@-]/.test(out))out="'"+out;
 return out;
}


/** GitHub Pages の公開画面から通常の HTML form POST で受ける入口。
 *  fetch/no-cors は送信成功を検証できないため使用しない。 */
function doPost(e) {
  try {
    const encoded = e && e.parameter && e.parameter.payload;
    if (typeof encoded !== 'string' || encoded.length > 50000) throw new Error('invalid payload');
    const payload = JSON.parse(encoded);
    const result = submitSurvey(payload);
    if (!result || result.ok !== true) throw new Error('not saved');
    const safeReceipt = String(result.receipt || '').replace(/[^a-zA-Z0-9-]/g, '');
    return receiptPage_(true, safeReceipt);
  } catch(err) {
    console.error('doPost rejected submission: ' + (err && err.message || 'unknown'));
    return receiptPage_(false, '');
  }
}
function receiptPage_(ok, receipt) {
  const title = ok ? '回答を受け付けました' : '回答を保存できませんでした';
  const content = ok
    ? '<p>ご協力ありがとうございました。以下の番号が表示された場合、回答は保存済みです。</p><div class="receipt">受付番号：'+receipt+'</div><p>この画面を閉じて構いません。入力画面へ戻る場合は、同じ回答IDで再送信しても重複登録されません。</p>'
    : '<p>通信または入力の確認で問題が発生しました。回答の保存は確認できませんでした。元のアンケート画面に戻り、入力内容を確認してから送信し直してください。</p>';
  const html = '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>AkiSpot｜'+title+'</title><style>body{font:16px/1.8 system-ui,-apple-system,sans-serif;background:#f5f7f3;color:#173b2d;margin:0;padding:28px 18px}.card{max-width:620px;margin:30px auto;padding:28px 24px;border-radius:18px;background:white;border:1px solid #cfddcf}h1{font-size:24px}.receipt{font-weight:800;font-size:21px;overflow-wrap:anywhere;background:#eaf7ee;border-radius:10px;padding:16px}.warn{background:#fff3e8;padding:13px;border-radius:10px}button{padding:12px 20px;border-radius:9px;background:#207752;color:white;font:inherit;border:0;cursor:pointer}</style></head><body><main class="card"><p>AkiSpot｜大学の演習アンケート</p><h1>'+title+'</h1><div class="'+(ok?'':'warn')+'">'+content+'</div><p><button type="button" onclick="window.history.back()">アンケート画面に戻る</button></p></main></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('AkiSpot｜'+title).addMetaTag('viewport','width=device-width,initial-scale=1');
}
