<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$host = '127.0.0.1';
$dbname = 'teplolux';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$body = json_decode(file_get_contents('php://input'), true) ?? [];

// ===== АВТОРИЗАЦИЯ =====
if ($action === 'login' && $method === 'POST') {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$body['username'] ?? '']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && $user['password'] === ($body['password'] ?? '')) {
        unset($user['password']);
        echo json_encode($user);
    } else {
        echo json_encode(null);
    }
    exit;
}

// ===== ДОБАВИТЬ ОБРАЩЕНИЕ =====
if ($action === 'addReception' && $method === 'POST') {
    $stmt = $pdo->prepare("INSERT INTO receptions (type, fullname, phone, email, address, subject, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'new')");
    $stmt->execute([
        $body['type'] ?? 'question',
        $body['fullname'] ?? '',
        $body['phone'] ?? '',
        $body['email'] ?? '',
        $body['address'] ?? '',
        $body['subject'] ?? '',
        $body['message'] ?? ''
    ]);
    
    echo json_encode(['id' => $pdo->lastInsertId(), 'status' => 'new']);
    exit;
}

// ===== ПОЛУЧИТЬ ОБРАЩЕНИЯ =====
if ($action === 'getReceptions' && $method === 'GET') {
    $status = $_GET['status'] ?? 'all';
    
    if ($status === 'all') {
        $stmt = $pdo->query("SELECT * FROM receptions ORDER BY created_at DESC");
    } else {
        $stmt = $pdo->prepare("SELECT * FROM receptions WHERE status = ? ORDER BY created_at DESC");
        $stmt->execute([$status]);
    }
    
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// ===== ОБНОВИТЬ СТАТУС ОБРАЩЕНИЯ =====
if ($action === 'updateReceptionStatus' && $method === 'POST') {
    $sql = "UPDATE receptions SET status = ?";
    if (in_array($body['status'] ?? '', ['answered', 'closed'])) {
        $sql .= ", responded_at = NOW()";
    }
    $sql .= " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$body['status'] ?? '', $body['id'] ?? 0]);
    
    echo json_encode(['success' => true]);
    exit;
}

// ===== ДОБАВИТЬ ОГРАНИЧЕНИЕ =====
if ($action === 'addRestriction' && $method === 'POST') {
    $stmt = $pdo->prepare("INSERT INTO restrictions (streets, date_from, date_to, time_from, time_to, reason, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')");
    $stmt->execute([
        json_encode($body['streets'] ?? []),
        $body['dateFrom'] ?? '',
        $body['dateTo'] ?? '',
        $body['timeFrom'] ?? '09:00',
        $body['timeTo'] ?? '17:00',
        $body['reason'] ?? 'other',
        $body['description'] ?? ''
    ]);
    
    echo json_encode(['id' => $pdo->lastInsertId()]);
    exit;
}

// ===== ПОЛУЧИТЬ АКТИВНЫЕ ОГРАНИЧЕНИЯ =====
if ($action === 'getActiveRestrictions' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM restrictions WHERE status = 'active' AND date_to >= CURDATE() ORDER BY date_from ASC");
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as &$row) {
        $row['streets'] = json_decode($row['streets'], true) ?? [];
    }
    
    echo json_encode($results);
    exit;
}

// ===== ПОЛУЧИТЬ ВСЕ ОГРАНИЧЕНИЯ =====
if ($action === 'getAllRestrictions' && $method === 'GET') {
    $status = $_GET['status'] ?? 'all';
    
    if ($status === 'all') {
        $stmt = $pdo->query("SELECT * FROM restrictions ORDER BY created_at DESC");
    } else {
        $stmt = $pdo->prepare("SELECT * FROM restrictions WHERE status = ? ORDER BY created_at DESC");
        $stmt->execute([$status]);
    }
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($results as &$row) {
        $row['streets'] = json_decode($row['streets'], true) ?? [];
    }
    
    echo json_encode($results);
    exit;
}

// ===== ОБНОВИТЬ СТАТУС ОГРАНИЧЕНИЯ =====
if ($action === 'updateRestrictionStatus' && $method === 'POST') {
    $sql = "UPDATE restrictions SET status = ?";
    if ($body['status'] === 'completed') {
        $sql .= ", completed_at = NOW()";
    }
    $sql .= " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$body['status'] ?? '', $body['id'] ?? 0]);
    
    echo json_encode(['success' => true]);
    exit;
}

// ===== УДАЛИТЬ ОГРАНИЧЕНИЕ =====
if ($action === 'deleteRestriction' && $method === 'POST') {
    $stmt = $pdo->prepare("DELETE FROM restrictions WHERE id = ?");
    $stmt->execute([$body['id'] ?? 0]);
    
    echo json_encode(['success' => true]);
    exit;
}

// ===== СТАТИСТИКА =====
if ($action === 'getStats' && $method === 'GET') {
    $receptions = $pdo->query("SELECT status, COUNT(*) as count FROM receptions GROUP BY status")->fetchAll(PDO::FETCH_KEY_PAIR);
    $restrictions = $pdo->query("SELECT status, COUNT(*) as count FROM restrictions GROUP BY status")->fetchAll(PDO::FETCH_KEY_PAIR);
    
    echo json_encode([
        'totalReceptions' => array_sum($receptions),
        'newReceptions' => $receptions['new'] ?? 0,
        'viewedReceptions' => $receptions['viewed'] ?? 0,
        'answeredReceptions' => $receptions['answered'] ?? 0,
        'closedReceptions' => $receptions['closed'] ?? 0,
        'activeRestrictions' => $restrictions['active'] ?? 0
    ]);
    exit;
}

echo json_encode(['error' => 'Неизвестное действие: ' . $action]);