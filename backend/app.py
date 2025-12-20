from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from functools import wraps
import uuid
from datetime import datetime, timezone, timedelta
import csv
import io

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ============================================================
# CONFIG
# ============================================================
MIN_LIST_ITEMS = 20

# ============================================================
# Dummy in-memory "DB"
# ============================================================
users = {
    "provider@example.com": {
        "userId": "11111111-1111-1111-1111-111111111111",
        "email": "provider@example.com",
        "password": "PlainTextPassword",
        "accountType": "provider",
    },
    "viewer@example.com": {
        "userId": "22222222-2222-2222-2222-222222222222",
        "email": "viewer@example.com",
        "password": "PlainTextPassword",
        "accountType": "viewer",
    },
}

devices_by_provider = {
    "provider@example.com": [
        {
            "deviceId": "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
            "latitude": 22.57,
            "longitude": 88.36,
            "address": "Kolkata",
            "status": "online",
            "lastUpdate": "2025-12-19T10:30:00Z",
        },
        {
            "deviceId": "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
            "latitude": 22.60,
            "longitude": 88.40,
            "address": "New Town, Kolkata",
            "status": "offline",
            "lastUpdate": "2025-12-18T18:10:00Z",
        },
    ]
}

device_owner = {
    "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1": "provider@example.com",
    "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2": "provider@example.com",
}

traffic_logs = {
    "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1": [
        {
            "timestamp": "2025-12-19T08:00:00Z",
            "carCount": 120,
            "truckCount": 15,
            "busCount": 20,
            "motorcycleCount": 80,
            "autoRickshawCount": 40,
            "bicycleCount": 25,
            "pedestrianCount": 300,
        },
        {
            "timestamp": "2025-12-19T10:00:00Z",
            "carCount": 140,
            "truckCount": 12,
            "busCount": 18,
            "motorcycleCount": 90,
            "autoRickshawCount": 35,
            "bicycleCount": 20,
            "pedestrianCount": 280,
        },
        {
            "timestamp": "2025-12-19T12:00:00Z",
            "carCount": 100,
            "truckCount": 15,
            "busCount": 20,
            "motorcycleCount": 50,
            "autoRickshawCount": 84,
            "bicycleCount": 150,
            "pedestrianCount": 200,
        },
        {
            "timestamp": "2025-12-19T14:00:00Z",
            "carCount": 50,
            "truckCount": 18,
            "busCount": 30,
            "motorcycleCount": 100,
            "autoRickshawCount": 20,
            "bicycleCount": 450,
            "pedestrianCount": 300,
        },
        {
            "timestamp": "2025-12-19T16:00:00Z",
            "carCount": 100,
            "truckCount": 30,
            "busCount": 36,
            "motorcycleCount": 85,
            "autoRickshawCount": 39,
            "bicycleCount": 69,
            "pedestrianCount": 56,
        },
        {
            "timestamp": "2025-12-19T18:00:00Z",
            "carCount": 22,
            "truckCount": 15,
            "busCount": 52,
            "motorcycleCount": 90,
            "autoRickshawCount": 75,
            "bicycleCount": 90,
            "pedestrianCount": 100,
        },
        {
            "timestamp": "2025-12-19T20:00:00Z",
            "carCount": 50,
            "truckCount": 18,
            "busCount": 30,
            "motorcycleCount": 100,
            "autoRickshawCount": 30,
            "bicycleCount": 93,
            "pedestrianCount": 84,
        },
    ],
    "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2": [
        {
            "timestamp": "2025-12-19T09:00:00Z",
            "carCount": 60,
            "truckCount": 5,
            "busCount": 7,
            "motorcycleCount": 40,
            "autoRickshawCount": 18,
            "bicycleCount": 10,
            "pedestrianCount": 120,
        },
        {
            "timestamp": "2025-12-19T11:00:00Z",
            "carCount": 75,
            "truckCount": 6,
            "busCount": 9,
            "motorcycleCount": 45,
            "autoRickshawCount": 22,
            "bicycleCount": 12,
            "pedestrianCount": 140,
        },
        {
            "timestamp": "2025-12-19T13:00:00Z",
            "carCount": 82,
            "truckCount": 15,
            "busCount": 63,
            "motorcycleCount": 20,
            "autoRickshawCount": 40,
            "bicycleCount": 22,
            "pedestrianCount": 80,
        },
        {
            "timestamp": "2025-12-19T15:00:00Z",
            "carCount": 60,
            "truckCount": 25,
            "busCount": 50,
            "motorcycleCount": 115,
            "autoRickshawCount": 82,
            "bicycleCount": 70,
            "pedestrianCount": 100,
        },
        {
            "timestamp": "2025-12-19T17:00:00Z",
            "carCount": 90,
            "truckCount": 15,
            "busCount": 23,
            "motorcycleCount": 94,
            "autoRickshawCount": 52,
            "bicycleCount": 16,
            "pedestrianCount": 84,
        },
        {
            "timestamp": "2025-12-19T19:00:00Z",
            "carCount": 70,
            "truckCount": 2,
            "busCount": 8,
            "motorcycleCount": 30,
            "autoRickshawCount": 51,
            "bicycleCount": 40,
            "pedestrianCount": 70,
        },
        {
            "timestamp": "2025-12-19T21:00:00Z",
            "carCount": 90,
            "truckCount": 25,
            "busCount": 36,
            "motorcycleCount": 84,
            "autoRickshawCount": 150,
            "bicycleCount": 75,
            "pedestrianCount": 22,
        },
    ],
}

# ============================================================
# Helpers: dummy auth/JWT
# ============================================================
def get_bearer_token():
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return None

# Token is just the email (e.g. "provider@example.com")
def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        token = get_bearer_token()
        if not token or token not in users:
            return jsonify({"success": False, "message": "Unauthorized"}), 401
        request.user = users[token]
        return fn(*args, **kwargs)
    return wrapper

def require_role(role):
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if request.user.get("accountType") != role:
                return jsonify({"success": False, "message": "Forbidden"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return deco

# ============================================================
# Dummy data generators (ensure at least 20 items)
# ============================================================
def iso_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

def make_device(i, owner_email):
    # deterministic-ish device id so it looks stable
    dev_id = f"dev-{i:02d}-{owner_email.split('@')[0]}"
    return {
        "deviceId": dev_id,
        "latitude": 22.50 + (i * 0.01),
        "longitude": 88.30 + (i * 0.01),
        "address": f"Dummy Location {i}, Kolkata",
        "status": "online" if i % 2 == 0 else "offline",
        "lastUpdate": "2025-12-19T09:00:00Z",
    }

def ensure_min_devices_for_provider(provider_email, min_items=MIN_LIST_ITEMS):
    devs = devices_by_provider.setdefault(provider_email, [])
    existing_ids = {d["deviceId"] for d in devs}

    i = 1
    while len(devs) < min_items:
        d = make_device(i, provider_email)
        # if collision, bump i
        if d["deviceId"] in existing_ids:
            i += 1
            continue
        devs.append(d)
        existing_ids.add(d["deviceId"])
        device_owner[d["deviceId"]] = provider_email
        traffic_logs.setdefault(d["deviceId"], [])
        i += 1

    return devs

def make_traffic_record(base_dt, j):
    # base_dt is datetime; j is int
    ts = (base_dt - timedelta(minutes=15 * j)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "timestamp": ts,
        "carCount": 50 + j,
        "truckCount": 5 + (j % 4),
        "busCount": 7 + (j % 3),
        "motorcycleCount": 30 + j,
        "autoRickshawCount": 15 + (j % 5),
        "bicycleCount": 10 + (j % 6),
        "pedestrianCount": 100 + (j * 3),
    }

def ensure_min_traffic_for_device(device_id, min_items=MIN_LIST_ITEMS):
    logs = traffic_logs.setdefault(device_id, [])
    base_dt = datetime.now(timezone.utc)

    # If existing logs already >= min, keep them
    j = 0
    while len(logs) < min_items:
        logs.append(make_traffic_record(base_dt, j))
        j += 1

    return logs

# ============================================================
# 3.1 Authentication Module
# ============================================================
@app.route("/api/v1/auth/signup", methods=["POST"])
def signup():
    body = request.get_json(force=True, silent=True) or {}
    email = body.get("email")
    password = body.get("password")
    account_type = body.get("accountType")

    if not email or not password or account_type not in ("provider", "viewer"):
        return jsonify({"success": False, "message": "Invalid request"}), 400
    if email in users:
        return jsonify({"success": False, "message": "User already exists"}), 409

    users[email] = {
        "userId": str(uuid.uuid4()),
        "email": email,
        "password": password,
        "accountType": account_type,
    }
    return jsonify({"success": True, "message": "User registered successfully"}), 201

@app.route("/api/v1/auth/login", methods=["POST"])
def login():
    body = request.get_json(force=True, silent=True) or {}
    email = body.get("email")
    password = body.get("password")

    u = users.get(email)
    if not u or u["password"] != password:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    # Dummy token = email
    return jsonify({
        "success": True,
        "data": {
            "userId": u["userId"],
            "email": u["email"],
            "accountType": u["accountType"],
            "token": u["email"],
        }
    }), 200

@app.route("/api/v1/auth/logout", methods=["POST"])
@require_auth
def logout():
    return jsonify({"success": True, "message": "Logged out"}), 200

# ============================================================
# 3.2 Data Provider Module
# ============================================================
@app.route("/api/v1/providers/dashboard", methods=["GET"])
@require_auth
@require_role("provider")
def provider_dashboard():
    email = request.user["email"]

    # Get only actual devices for this provider
    devs = devices_by_provider.get(email, [])

    total = len(devs)
    online = sum(1 for d in devs if d.get("status") == "online")
    offline = total - online

    return jsonify({
        "success": True,
        "data": {
            "email": email,
            "totalDevices": total,
            "onlineDevices": online,
            "offlineDevices": offline,
            "devices": devs,
        }
    }), 200

@app.route("/api/v1/providers/devices", methods=["POST"])
@require_auth
@require_role("provider")
def add_device():
    body = request.get_json(force=True, silent=True) or {}
    lat = body.get("latitude")
    lon = body.get("longitude")
    address = body.get("address")

    if lat is None or lon is None or not address:
        return jsonify({"success": False, "message": "Invalid request"}), 400

    device_id = str(uuid.uuid4())
    now_iso = iso_now()

    device = {
        "deviceId": device_id,
        "latitude": float(lat),
        "longitude": float(lon),
        "address": address,
        "status": "offline",
        "lastUpdate": now_iso,
    }

    email = request.user["email"]
    devices_by_provider.setdefault(email, []).append(device)
    device_owner[device_id] = email
    traffic_logs.setdefault(device_id, [])

    return jsonify({
        "success": True,
        "data": {"deviceId": device_id},
        "message": "Device added successfully"
    }), 201

@app.route("/api/v1/providers/devices/<deviceId>", methods=["DELETE"])
@require_auth
@require_role("provider")
def remove_device(deviceId):
    email = request.user["email"]
    devs = devices_by_provider.get(email, [])
    new_devs = [d for d in devs if d.get("deviceId") != deviceId]
    if len(new_devs) == len(devs):
        return jsonify({"success": False, "message": "Device not found"}), 404

    devices_by_provider[email] = new_devs
    device_owner.pop(deviceId, None)
    traffic_logs.pop(deviceId, None)

    return jsonify({"success": True, "message": "Device removed"}), 200

@app.route("/api/v1/providers/devices/<deviceId>/iot-credentials", methods=["POST"])
@require_auth
@require_role("provider")
def iot_credentials(deviceId):
    email = request.user["email"]
    if device_owner.get(deviceId) != email:
        return jsonify({"success": False, "message": "Device not found"}), 404

    return jsonify({
        "success": True,
        "data": {
            "thingName": f"traffic-device-{deviceId}",
            "certificatePem": "-----BEGIN CERTIFICATE-----DUMMY-----END CERTIFICATE-----",
            "privateKey": "-----BEGIN PRIVATE KEY-----DUMMY-----END PRIVATE KEY-----",
            "publicKey": "-----BEGIN PUBLIC KEY-----DUMMY-----END PUBLIC KEY-----",
            "iotEndpoint": "xxxxxxxx.iot.region.amazonaws.com",
            "policyName": "TrafficDevicePolicy",
        }
    }), 200

# ============================================================
# 3.3 Traffic Data Module
# ============================================================
@app.route("/api/v1/traffic/logs", methods=["POST"])
def upload_traffic_logs():
    body = request.get_json(force=True, silent=True) or {}
    device_id = body.get("deviceId")
    ts = body.get("timestamp")

    if not device_id or not ts:
        return jsonify({"success": False, "message": "deviceId and timestamp required"}), 400
    if device_id not in device_owner:
        return jsonify({"success": False, "message": "Unknown deviceId"}), 404

    rec = {
        "timestamp": ts,
        "carCount": int(body.get("carCount", 0)),
        "truckCount": int(body.get("truckCount", 0)),
        "busCount": int(body.get("busCount", 0)),
        "motorcycleCount": int(body.get("motorcycleCount", 0)),
        "autoRickshawCount": int(body.get("autoRickshawCount", 0)),
        "bicycleCount": int(body.get("bicycleCount", 0)),
        "pedestrianCount": int(body.get("pedestrianCount", 0)),
    }
    traffic_logs.setdefault(device_id, []).append(rec)

    # Update device status/lastUpdate
    owner = device_owner[device_id]
    for d in devices_by_provider.get(owner, []):
        if d["deviceId"] == device_id:
            d["status"] = "online"
            d["lastUpdate"] = iso_now()
            break

    return jsonify({"success": True, "message": "Traffic data logged successfully"}), 201

# ============================================================
# 3.4 Data Viewer Module
# ============================================================
@app.route("/api/v1/viewer/devices", methods=["GET"])
@require_auth
@require_role("viewer")
def viewer_all_devices():
    # Return only actual devices from backend
    out = []
    for provider_email, devs in devices_by_provider.items():
        for d in devs:
            out.append({
                "deviceId": d["deviceId"],
                "providerEmail": provider_email,
                "latitude": d["latitude"],
                "longitude": d["longitude"],
                "address": d["address"],
                "status": d["status"],
                "lastUpdate": d["lastUpdate"],
            })

    return jsonify({"success": True, "data": out}), 200

@app.route("/api/v1/viewer/devices/<deviceId>/traffic", methods=["GET"])
@require_auth
@require_role("viewer")
def viewer_device_traffic(deviceId):
    if deviceId not in device_owner:
        return jsonify({"success": False, "message": "Device not found"}), 404

    dev_owner = device_owner[deviceId]
    device_details = None
    for d in devices_by_provider.get(dev_owner, []):
        if d["deviceId"] == deviceId:
            device_details = d
            break

    # Get only actual traffic logs for this device
    logs = traffic_logs.get(deviceId, [])

    return jsonify({
        "success": True,
        "data": {
            "deviceDetails": {
                "deviceId": deviceId,
                "address": (device_details or {}).get("address", "Unknown"),
                "latitude": (device_details or {}).get("latitude", 0),
                "longitude": (device_details or {}).get("longitude", 0),
                "status": (device_details or {}).get("status", "offline"),
                "lastDataUpload": logs[-1]["timestamp"] if logs else None,
            },
            "trafficData": logs,
        }
    }), 200

@app.route("/api/v1/viewer/devices/<deviceId>/traffic/export", methods=["GET"])
@require_auth
@require_role("viewer")
def export_traffic_csv(deviceId):
    if deviceId not in device_owner:
        return jsonify({"success": False, "message": "Device not found"}), 404

    # Get only actual traffic logs for this device
    logs = traffic_logs.get(deviceId, [])

    output = io.StringIO()
    fieldnames = [
        "timestamp", "carCount", "truckCount", "busCount",
        "motorcycleCount", "autoRickshawCount", "bicycleCount", "pedestrianCount"
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in logs:
        writer.writerow({k: row.get(k, "") for k in fieldnames})

    return Response(
        output.getvalue().encode("utf-8"),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={deviceId}_traffic.csv"}
    )

# ============================================================
# Run
# ============================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
