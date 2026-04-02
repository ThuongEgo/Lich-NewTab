/*
 * Copyright (c) 2026 thuongdq. All rights reserved.
 */
/* eslint-disable no-undef */
/* global getLunarDate, getCanChi, TUAN, GIO_HD, CHI, CAN */

// ------------------------------------------------------------
//  Tiện ích thời gian: lấy "ngày hôm nay" theo UTC+7 (Việt Nam)
// ------------------------------------------------------------
function getNowVietnam() {
  // Chuyển thời gian hệ thống sang UTC rồi cộng UTC+7.
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const vnMs = utcMs + 7 * 3_600_000;
  const vn = new Date(vnMs);

  return {
    year: vn.getUTCFullYear(),
    month: vn.getUTCMonth() + 1,
    day: vn.getUTCDate(),
    hour: vn.getUTCHours(),
    minute: vn.getUTCMinutes(),
    second: vn.getUTCSeconds(),
    key: `${vn.getUTCFullYear()}-${vn.getUTCMonth() + 1}-${vn.getUTCDate()}`,
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function solarToKey(y, m, d) {
  return y * 10000 + m * 100 + d;
}

// ------------------------------------------------------------
//  Giờ Hoàng Đạo: lấy 6 giờ tốt từ JDN của ngày âm
// ------------------------------------------------------------
const HOUR_RANGES = {
  "Tý": "23:00-01:00",
  "Sửu": "01:00-03:00",
  "Dần": "03:00-05:00",
  "Mão": "05:00-07:00",
  "Thìn": "07:00-09:00",
  "Tỵ": "09:00-11:00",
  "Ngọ": "11:00-13:00",
  "Mùi": "13:00-15:00",
  "Thân": "15:00-17:00",
  "Dậu": "17:00-19:00",
  "Tuất": "19:00-21:00",
  "Hợi": "21:00-23:00",
};

function getLuckyHoursFromJd(jd) {
  const chiOfDay = (jd + 1) % 12;
  const gioHD = GIO_HD[chiOfDay % 6]; // chuỗi 12 ký tự '0'/'1'

  const res = [];
  for (let i = 0; i < 12; i++) {
    if (gioHD.charAt(i) === "1") {
      const name = CHI[i];
      res.push({ name, range: HOUR_RANGES[name] || "" });
    }
  }
  return res;
}

function getChiOfHourVN(hour) {
  // Quy ước khung giờ theo địa chi:
  // Tý: 23-01, Sửu: 01-03, ... Hợi: 21-23.
  if (hour === 23 || hour < 1) return "Tý";
  if (hour < 3) return "Sửu";
  if (hour < 5) return "Dần";
  if (hour < 7) return "Mão";
  if (hour < 9) return "Thìn";
  if (hour < 11) return "Tỵ";
  if (hour < 13) return "Ngọ";
  if (hour < 15) return "Mùi";
  if (hour < 17) return "Thân";
  if (hour < 19) return "Dậu";
  if (hour < 21) return "Tuất";
  if (hour < 23) return "Hợi";
  return "Tý";
}

// ------------------------------------------------------------
//  Tiết khí (24): tính theo thuật toán chuẩn ngày (xấp xỉ theo thời gian)
//  - Dùng mảng sTermInfo (offset phút) và epoch phổ biến của nhiều thư viện
//  - Điều chỉnh lệch múi giờ để xấp xỉ UTC+7 so với epoch tham chiếu (+8)
// ------------------------------------------------------------
const TIET_KHI_STD = [
  "Tiểu hàn",
  "Đại hàn",
  "Lập xuân",
  "Vũ Thủy",
  "Kinh trập",
  "Xuân phân",
  "Thanh minh",
  "Cốc vũ",
  "Lập hạ",
  "Tiểu mãn",
  "Mang chủng",
  "Hạ chí",
  "Tiểu thử",
  "Đại thử",
  "Lập thu",
  "Xử thử",
  "Bạch lộ",
  "Thu phân",
  "Hàn lộ",
  "Sương giáng",
  "Lập đông",
  "Tiểu tuyết",
  "Đại tuyết",
  "Đông chí",
];

const sTermInfo = [
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551,
  218072, 240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447,
  419210, 440795, 462224, 483532, 504758,
];

const TERM_EPOCH_UTC_MS = Date.UTC(1900, 0, 6, 2, 5);
const SECONDS_PER_MINUTE = 60;

// Xấp xỉ UTC+7 so với epoch tham chiếu (+8): dịch -1 giờ.
const TERM_TZ_DELTA_HOURS = -1;

function getSolarTermMomentUTC(year, termIndex) {
  // offset theo năm: 31556925974.7 ms * (year - 1900)
  const offMs =
    31556925974.7 * (year - 1900) + sTermInfo[termIndex] * 60_000;
  return new Date(TERM_EPOCH_UTC_MS + offMs + TERM_TZ_DELTA_HOURS * 3_600_000);
}

function getCurrentSolarTermName(nowVn) {
  const todayKey = solarToKey(nowVn.year, nowVn.month, nowVn.day);

  // Sinh danh sách tiết khí cho năm hiện tại và năm trước (để tránh lệch qua giao thừa).
  const entries = [];
  for (const y of [nowVn.year - 1, nowVn.year]) {
    for (let i = 0; i < 24; i++) {
      const dt = getSolarTermMomentUTC(y, i);
      const key = solarToKey(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
      entries.push({ key, i, name: TIET_KHI_STD[i] });
    }
  }

  entries.sort((a, b) => a.key - b.key);

  // Lấy tiết khí gần nhất trước hoặc bằng hôm nay.
  let cur = entries[0];
  for (const e of entries) {
    if (e.key <= todayKey) cur = e;
    else break;
  }

  return cur?.name || "";
}

// ------------------------------------------------------------
//  UI: render thông tin chính
// ------------------------------------------------------------
const el = {
  lunarBig: document.getElementById("lunarBig"),
  weekLine: document.getElementById("weekLine"),
  lunarBadgeDay: document.getElementById("lunarBadgeDay"),
  lunarBadgeMonth: document.getElementById("lunarBadgeMonth"),
  canChiYear: document.getElementById("canChiYear"),
  canChiMonth: document.getElementById("canChiMonth"),
  canChiDay: document.getElementById("canChiDay"),
  timeText: document.getElementById("timeText"),
  gioCanChiText: document.getElementById("gioCanChiText"),
  openMonthBtn: document.getElementById("openMonthBtn"),
  setBgBtn: document.getElementById("setBgBtn"),
  resetBgBtn: document.getElementById("resetBgBtn"),
  bgFileInput: document.getElementById("bgFileInput"),
  quoteText: document.querySelector(".quote-text"),
  quoteAuthor: document.querySelector(".quote-author"),
};

function getWeekdayFromJd(jd) {
  return TUAN[(jd + 1) % 7];
}

const uiState = {
  lastDayKey: "",
  currentLunar: null,
};

// ------------------------------------------------------------
//  Quote: chế độ 2 = mỗi lần mở tab chọn 1 quote ngẫu nhiên
// ------------------------------------------------------------
const QUOTES = [
  {
    text: "Giá trị của một ý tưởng nằm ở cách sử dụng nó. - The value of an idea lies in the using of it.",
    author: "Thomas Edison",
  },
  {
    text: "Thành công không phải là điểm đến, mà là cách bạn đi trên con đường đó.",
    author: "Vô danh",
  },
  {
    text: "Cái đẹp của kỷ luật là bạn có thể biến mục tiêu thành hiện thực mỗi ngày.",
    author: "Vô danh",
  },
  {
    text: "Đừng sợ sai. Hãy sợ mình không dám bắt đầu.",
    author: "Vô danh",
  },
  {
    text: "Hãy làm điều đúng trước, rồi làm điều bạn muốn.",
    author: "Vô danh",
  },
  {
    text: "Nếu bạn muốn đi nhanh, hãy đi một mình. Nếu bạn muốn đi xa, hãy đi cùng nhau.",
    author: "Tục ngữ",
  },
];

function setRandomQuoteOnTabOpen() {
  if (!Array.isArray(QUOTES) || QUOTES.length === 0) return;
  if (!el.quoteText && !el.quoteAuthor) return;

  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  if (el.quoteText && q?.text) el.quoteText.textContent = q.text;
  if (el.quoteAuthor) el.quoteAuthor.textContent = q?.author ? String(q.author) : "";
}

// ------------------------------------------------------------
//  Ảnh nền tùy chọn (offline): lưu DataURL vào chrome.storage.local
// ------------------------------------------------------------
const STORAGE_BG_KEY = "backgroundDataUrl";

function applyUserBackground(dataUrl) {
  if (dataUrl) {
    document.documentElement.style.setProperty("--bg-user-image", `url("${dataUrl}")`);
    el.resetBgBtn.classList.remove("hidden");
    el.resetBgBtn.classList.add("ghost-btn--secondary");
  } else {
    document.documentElement.style.setProperty("--bg-user-image", "none");
    el.resetBgBtn.classList.add("hidden");
  }
}

function loadUserBackground() {
  try {
    chrome.storage.local.get([STORAGE_BG_KEY], (res) => {
      const dataUrl = res?.[STORAGE_BG_KEY];
      applyUserBackground(typeof dataUrl === "string" ? dataUrl : null);
    });
  } catch {
    // Nếu chrome.storage bị chặn (hiếm), giữ nguyên nền mặc định.
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được file ảnh."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

async function handlePickBackground(file) {
  if (!file) return;
  if (!file.type || !file.type.startsWith("image/")) return;

  const dataUrl = await readFileAsDataURL(file);
  try {
    chrome.storage.local.set({ [STORAGE_BG_KEY]: dataUrl }, () => {
      applyUserBackground(dataUrl);
    });
  } catch {
    // Nếu storage lỗi, vẫn apply trực tiếp trong phiên hiện tại.
    applyUserBackground(dataUrl);
  }
}

el.setBgBtn?.addEventListener("click", () => {
  el.bgFileInput?.click();
});

el.bgFileInput?.addEventListener("change", async () => {
  const file = el.bgFileInput.files?.[0];
  await handlePickBackground(file);
});

el.resetBgBtn?.addEventListener("click", () => {
  try {
    chrome.storage.local.remove(STORAGE_BG_KEY, () => {
      applyUserBackground(null);
    });
  } catch {
    applyUserBackground(null);
  }
});

loadUserBackground();

function renderMain() {
  const nowVn = getNowVietnam();
  const lunar = getLunarDate(nowVn.day, nowVn.month, nowVn.year);

  // Thanh tháng ở đầu trang
  el.openMonthBtn.textContent = `Tháng ${nowVn.month} - ${nowVn.year}`;

  // Số ngày lớn + Thứ
  el.lunarBig.textContent = String(nowVn.day);
  el.weekLine.textContent = getWeekdayFromJd(lunar.jd).toUpperCase();

  // Thẻ tròn ngày âm: <lunar.day> - THÁNG <lunar.month>
  el.lunarBadgeDay.textContent = String(lunar.day);
  el.lunarBadgeMonth.textContent = String(lunar.month);

  // Can Chi (năm/tháng/ngày)
  const [dayCC, monthCC, yearCC] = getCanChi(lunar);
  const stripNhuan = (s) => s.replace(/\s*\(nhuận\)\s*/i, "");
  el.canChiYear.textContent = `Năm ${stripNhuan(yearCC)}`;
  el.canChiMonth.textContent = `Tháng ${stripNhuan(monthCC)}`;
  el.canChiDay.textContent = `Ngày ${stripNhuan(dayCC)}`;

  uiState.currentLunar = lunar;
  uiState.lastDayKey = nowVn.key;
  updateTimeAndGio(nowVn);
}

function updateTimeAndGio(nowVn) {
  if (!uiState.currentLunar) return;

  // Hiển thị giờ: phút (HH:mm)
  el.timeText.textContent = `${pad2(nowVn.hour)}:${pad2(nowVn.minute)}`;

  // Tính Can Chi cho GIỜ (ví dụ: "Canh Ngọ") theo công thức:
  // - Chi của giờ lấy theo khung giờ hiện tại
  // - Thiên can của giờ phụ thuộc thiên can của ngày âm lịch (từ lunar.jd)
  const activeChi = getChiOfHourVN(nowVn.hour);
  const hourEarthIndex = CHI.indexOf(activeChi); // 0..11 (Tý..Hợi)
  if (hourEarthIndex < 0) return;

  const dayJd = Math.floor(uiState.currentLunar.jd);
  const dayHeavenIndex = (dayJd + 9) % 10; // 0..9 (Giáp..Quý)

  const hourStemIndex = (dayHeavenIndex * 2 + hourEarthIndex) % 10;
  const hourCC = `${CAN[hourStemIndex]} ${CHI[hourEarthIndex]}`;
  el.gioCanChiText.textContent = `Giờ ${hourCC}`;
}

// ------------------------------------------------------------
//  Modal: lịch tháng (dạng lưới đơn giản)
// ------------------------------------------------------------
const modal = {
  backdrop: document.getElementById("modalBackdrop"),
  dialog: document.getElementById("monthModal"),
  title: document.getElementById("modalTitle"),
  closeBtn: document.getElementById("closeModalBtn"),
  bodyGrid: document.getElementById("monthGrid"),
};

function openMonthModal() {
  const nowVn = getNowVietnam();
  const y = nowVn.year;
  const m = nowVn.month;

  modal.title.textContent = `Lịch ${m}/${y}`;

  // Tính số ngày trong tháng (dựa theo UTC date để ổn định theo VN).
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const firstDay = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0)).getTime() + 7 * 3_600_000;
  const firstDate = new Date(firstDay);
  // Monday-first
  const dow = (firstDate.getUTCDay() + 6) % 7; // 0..6

  // Đầu tuần
  const dowNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  modal.bodyGrid.innerHTML = "";
  for (const dname of dowNames) {
    const head = document.createElement("div");
    head.className = "dow-head";
    head.textContent = dname;
    modal.bodyGrid.appendChild(head);
  }

  // Ô trống
  for (let i = 0; i < dow; i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.style.visibility = "hidden";
    modal.bodyGrid.appendChild(cell);
  }

  // Ngày trong tháng
  for (let d = 1; d <= daysInMonth; d++) {
    const lunar = getLunarDate(d, m, y);
    const lunarStr = lunar.leap === 1 ? `${lunar.day}/${lunar.month} nhuận` : `${lunar.day}/${lunar.month}`;

    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.innerHTML = `
      <div class="day-solar">${d}/${m}</div>
      <div class="day-lunar">${lunarStr}</div>
    `;
    modal.bodyGrid.appendChild(cell);
  }

  modal.backdrop.classList.remove("hidden");
  modal.dialog.classList.remove("hidden");
  modal.backdrop.setAttribute("aria-hidden", "false");
}

function closeMonthModal() {
  modal.backdrop.classList.add("hidden");
  modal.dialog.classList.add("hidden");
  modal.backdrop.setAttribute("aria-hidden", "true");
}

el.openMonthBtn.addEventListener("click", openMonthModal);
modal.closeBtn.addEventListener("click", closeMonthModal);
modal.backdrop.addEventListener("click", closeMonthModal);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMonthModal();
});

// ------------------------------------------------------------
//  Realtime update mỗi phút
// ------------------------------------------------------------
function tick() {
  const nowVn = getNowVietnam();
  if (nowVn.key !== uiState.lastDayKey) {
    renderMain();
  } else {
    updateTimeAndGio(nowVn);
  }
}

renderMain();
setRandomQuoteOnTabOpen();
// Cập nhật mỗi 60 giây để đảm bảo không bị trễ khi đổi phút.
setInterval(tick, 60_000);

