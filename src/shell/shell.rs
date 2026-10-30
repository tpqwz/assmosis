#![no_std]
#![allow(static_mut_refs)]

mod programs;

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_: &PanicInfo) -> ! {
    loop {}
}

const PATH_MAX: usize = 256;
const OUT_MAX: usize = 8192;

static mut PATH: [u8; PATH_MAX] = [0; PATH_MAX];
static mut PATH_LEN: usize = 0;
static mut OUT: [u8; OUT_MAX] = [0; OUT_MAX];
static mut OUT_LEN: usize = 0;

struct Buf {
    data: [u8; OUT_MAX],
    len: usize,
}

impl Buf {
    fn new() -> Self {
        Self {
            data: [0; OUT_MAX],
            len: 0,
        }
    }

    fn push_bytes(&mut self, bytes: &[u8]) {
        let room = OUT_MAX - self.len;
        let n = if bytes.len() > room { room } else { bytes.len() };
        self.data[self.len..self.len + n].copy_from_slice(&bytes[..n]);
        self.len += n;
    }

    fn push(&mut self, text: &str) {
        self.push_bytes(text.as_bytes());
    }

    fn push_esc(&mut self, text: &str) {
        let mut tmp = [0u8; 4];
        for ch in text.chars() {
            match ch {
                '&' => self.push_bytes(&[38, 97, 109, 112, 59]),
                '<' => self.push_bytes(&[38, 108, 116, 59]),
                '>' => self.push_bytes(&[38, 103, 116, 59]),
                _ => {
                    let encoded = ch.encode_utf8(&mut tmp);
                    self.push(encoded);
                }
            }
        }
    }
}

const OPEN: &str = "<main id=\"app\"><p class=\"shell-lead\">";
const CLOSE: &str = "</p></main>";
const HOME_LEAD: &str =
    "Meetings and groups across twelve-step programs. Your list stays on this device.";
const SETTINGS_LEAD: &str = "Type, text size, import, and reminders.";
const WEEKLY_LEAD: &str = "The week ahead, ready to print.";

fn normalize(input: &str) -> &str {
    let mut s = input;
    if let Some(i) = s.find(['?', '#']) {
        s = &s[..i];
    }
    if let Some(i) = s.find(['\n', '\r']) {
        s = &s[..i];
    }
    if s.len() > 1 && s.ends_with('/') {
        s = &s[..s.len() - 1];
    }
    if let Some(stripped) = s.strip_suffix(".html") {
        s = stripped;
    }
    if s.len() > 1 && s.ends_with('/') {
        s = &s[..s.len() - 1];
    }
    if s.is_empty() {
        "/"
    } else {
        s
    }
}

fn lookup(id: &str) -> &str {
    for &(key, name) in programs::PROGRAMS {
        if key == id {
            return name;
        }
    }
    if id.is_empty() {
        "Program"
    } else {
        id
    }
}

fn write_page(buf: &mut Buf, path: &str) {
    if path == "/" || path == "/index" {
        buf.push("Assmosis\n");
        buf.push(OPEN);
        buf.push_esc(HOME_LEAD);
        buf.push(CLOSE);
        return;
    }
    if path == "/settings" {
        buf.push("Settings \u{00b7} Assmosis\n");
        buf.push(OPEN);
        buf.push_esc(SETTINGS_LEAD);
        buf.push(CLOSE);
        return;
    }
    if path == "/weekly" {
        buf.push("Weekly \u{00b7} Assmosis\n");
        buf.push(OPEN);
        buf.push_esc(WEEKLY_LEAD);
        buf.push(CLOSE);
        return;
    }
    if path == "/program" {
        write_program(buf, "");
        return;
    }
    if let Some(id) = path.strip_prefix("/program/") {
        write_program(buf, id);
        return;
    }
    buf.push("Assmosis\n");
    buf.push(OPEN);
    buf.push_esc(HOME_LEAD);
    buf.push(CLOSE);
}

fn write_program(buf: &mut Buf, id: &str) {
    let name = lookup(id);
    buf.push(name);
    buf.push(" \u{00b7} Assmosis\n");
    buf.push(OPEN);
    buf.push_esc(name);
    buf.push_esc(".");
    buf.push(CLOSE);
}

#[no_mangle]
pub unsafe extern "C" fn set_path_byte(i: u32, b: u32) {
    let i = i as usize;
    if i < PATH_MAX {
        PATH[i] = b as u8;
    }
}

#[no_mangle]
pub unsafe extern "C" fn set_path_len(n: u32) {
    let n = n as usize;
    PATH_LEN = if n > PATH_MAX { PATH_MAX } else { n };
}

#[no_mangle]
pub unsafe extern "C" fn html_ptr() -> u32 {
    OUT.as_ptr() as u32
}

#[no_mangle]
pub unsafe extern "C" fn html_len() -> u32 {
    OUT_LEN as u32
}

#[no_mangle]
pub unsafe extern "C" fn render() -> u32 {
    let mut raw = [0u8; PATH_MAX];
    let n = if PATH_LEN > PATH_MAX { PATH_MAX } else { PATH_LEN };
    let mut i = 0;
    while i < n {
        raw[i] = PATH[i];
        i += 1;
    }
    let text = core::str::from_utf8(&raw[..n]).unwrap_or("/");
    let path = normalize(text);
    let mut buf = Buf::new();
    write_page(&mut buf, path);
    OUT[..buf.len].copy_from_slice(&buf.data[..buf.len]);
    OUT_LEN = buf.len;
    buf.len as u32
}
