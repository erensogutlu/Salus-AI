"""
Salus AI - Python Modül Yöneticisi
==================================
Bu modül, gelen siber güvenlik araç isteklerini karşılar, ilgili alt modülleri
dinamik olarak yükler ve yürütür.

Tüm işlemler JSON tabanlı girdi/çıktı protokolü ile Node.js sunucusuyla haberleşir.
"""

import sys
import os
import importlib.util
import json
import io
import base64
import time
import logging
from types import ModuleType
from typing import Any, Dict, List, Optional

# loglama yapılandırması: loglar stderr'e yönlendirilir (stdout sadece temiz json çıktıları içindir)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)]
)
logger = logging.getLogger("PythonYoneticisi")

# utf-8 standart giriş/çıkış yapılandırması
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
else:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def modul_yukle(modul_adi: str, modul_yolu: str) -> Optional[ModuleType]:
    """Bir Python modülünü belirtilen yoldan dinamik olarak yükler."""
    try:
        spec = importlib.util.spec_from_file_location(modul_adi, modul_yolu)
        if spec is None or spec.loader is None:
            logger.warning(f"Modül spesifikasyonu oluşturulamadı: {modul_adi}")
            return None
        
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod
    except Exception as e:
        logger.error(f"Modül yükleme hatası ({modul_adi}): {e}", exc_info=True)
        return None


def main() -> None:
    """Modül yöneticisinin ana giriş noktası."""
    start_time = time.perf_counter()

    if len(sys.argv) < 2:
        print(json.dumps({"handled": False, "error": "No message provided."}))
        return

    raw_arg: str = sys.argv[1]
    user_message: str = ""
    data: Dict[str, Any] = {}

    try:
        decoded_bytes = base64.b64decode(raw_arg)
        data = json.loads(decoded_bytes.decode('utf-8'))
        user_message = data.get("mesaj", "")
    except Exception:
        user_message = raw_arg
        data = {"mesaj": user_message}

    base_dir = os.path.dirname(os.path.abspath(__file__))
    modules_dir = os.path.join(base_dir, "moduller")

    if not os.path.exists(modules_dir):
        logger.error(f"Modüller dizini bulunamadı: {modules_dir}")
        print(json.dumps({"handled": False, "error": "moduller directory not found."}))
        return

    sys.path.append(modules_dir)
    modul_listesi: List[Dict[str, Any]] = []

    for filename in os.listdir(modules_dir):
        if filename.endswith(".py") and filename != "__init__.py":
            module_name = filename[:-3]
            module_path = os.path.join(modules_dir, filename)

            mod = modul_yukle(module_name, module_path)
            if mod is None:
                continue

            if not (hasattr(mod, "can_handle") and hasattr(mod, "execute")):
                continue

            oncelik: int = getattr(mod, "PRIORITY", 50)

            meta = {
                "ad": module_name,
                "versiyon": getattr(mod, "VERSION", "1.0.0"),
                "aciklama": getattr(mod, "DESCRIPTION", ""),
                "yazar": getattr(mod, "AUTHOR", "Salus AI"),
                "oncelik": oncelik,
                "modul": mod
            }
            modul_listesi.append(meta)

    modul_listesi.sort(key=lambda m: m["oncelik"])

    for meta in modul_listesi:
        mod = meta["modul"]
        try:
            if mod.can_handle(user_message):
                mod_start = time.perf_counter()
                response = mod.execute(user_message)
                elapsed_ms = (time.perf_counter() - mod_start) * 1000
                total_elapsed_ms = (time.perf_counter() - start_time) * 1000

                logger.info(f"Modül '{meta['ad']}' başarıyla çalıştırıldı. Süre: {elapsed_ms:.2f}ms")
                
                print(json.dumps({
                    "handled": True,
                    "response": response,
                    "modul": meta["ad"],
                    "versiyon": meta["versiyon"],
                    "sure_ms": round(elapsed_ms, 2),
                    "toplam_sure_ms": round(total_elapsed_ms, 2)
                }, ensure_ascii=False))
                return
        except Exception as e:
            logger.error(f"Modül çalıştırma hatası ({meta['ad']}): {e}", exc_info=True)
            continue

    logger.info("Hiçbir modül gelen mesajı işleyemedi.")
    print(json.dumps({"handled": False}))

if __name__ == "__main__":
    main()