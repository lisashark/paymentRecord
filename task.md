## task
我想要重寫記帳工具，app.js  index.html styles.css都可以全部刪除，請依以下說明重新開發

## 記帳工具需要串接 Google 試算表
- 透過google auth 登入
- 資料存放於google 試算表

### 前端技術
- 請協助重寫 HTML、CSS、JavaScript 的檔案
- 我會準備 Google OAuth Client ID、試算表路徑，請提供變數，並填入下方預設資料

### 預設Google 試算表與google cloud資訊
  CLIENT_ID: "991561900008-6k3ok2g8d6tb2egtl1aj1ql2a4hgi9cd.apps.googleusercontent.com",
  SPREADSHEET_ID: "1Aq3CdxGaPHBMCamPD0hajwm35b6Ik8BJMR7dA84jnx8",
  SHEET_RECORDS: "記帳紀錄",
  SHEET_FIELDS: "欄位表",

## 資料內容
### Google 試算表資料格式
Google 試算表上有兩個工作表，[記帳紀錄] 及 [欄位表]
[記帳紀錄] 工作表欄位有８個如下：
ID,	Date,	Type,	Category,	Amount,	Description,	note,	created_at,

- ID 屆時使用 由１開始遞增 作為唯一碼,由程式自動產生
- Type 僅能輸入 收入、支出 兩個選項,由user透過select選擇
- Amount 輸入數值金額,由user透過input number輸入
- Description,note 為純文字描述,由user透過input text輸入
- Category 則會從欄位表對應,由user透過select選擇
- created_at 為建立時間,由程式自動產生
- Date 為消費日期,由user透過date picker輸入


[欄位表] 工作表內容如下：(此表用於欄位選項)
Type: 支出,收入	
Category：
餐飲食品
交通運輸
居家生活
休閒娛樂
學習成長
醫療保健
購物服飾
其他雜項  /*以上隸屬於支出*/

薪水
信用卡回饋
其他收入 /*以上隸屬於收入*/

- 當user選擇Type為收入時，Category僅能顯示薪水、信用卡回饋、其他收入; 當user選擇Type為支出時，Category僅能顯示餐飲食品、交通運輸、居家生活、休閒娛樂、學習成長、醫療保健、購物服飾、其他雜項



## 功能說明
### 登入
- 透過google auth 登入
- 登入成功後，顯示"已登入"，並顯示"登出"按鈕
- 登入失敗後，顯示"登入失敗"，並維持"登入"按鈕

### 登出
- 登出後，按鈕需更新為"登入"
- 登出失敗後，顯示"登出失敗"，並維持"登出"按鈕

### 記帳
- 透過ＵＩ介面，user可以輸入Date、Type、Category、Amount、Description、note
- 點擊送出後，將資料寫入Google 試算表
- 成功後，跳出彈窗顯示"已送出"
- 失敗後，跳出彈窗顯示"送出失敗"

### 記錄管理
- 透過month filter,可呈現對映月份的歷史記錄
- 呈現方式為表格，表格欄位有Date、Type、Category、Amount、Description、note
- 提供類別filter,可篩選呈現指定類別的歷史記錄
- 每筆資料的最後一欄為操作欄，有刪除按鈕，點擊後刪除該筆資料
- 刪除成功後，跳出彈窗顯示"已刪除"
- 刪除失敗後，跳出彈窗顯示"刪除失敗"
- 每個月份提供統計數據，包含總收入、總支出、淨收入、類別比例圓餅圖


## UI 呈現
### 風格
- 日系可愛風
- 大地溫暖的色系
- 圓角
### 版型
- header (登入、登出)
- main
  - 記帳 (100% width)
  - 記錄管理 (100% width)
- footer(copyright)
### 響應式
- 手機版
- 平板版
- 電腦版