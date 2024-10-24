{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  # PHP version
  buildInputs = [
    pkgs.php83           # PHP 8.1
    pkgs.phpPackages.composer        # Composer package manager
    pkgs.nodejs          # Node.js for npm and frontend dependencies
    pkgs.php83Extensions.pdo_mysql  # PHP MySQL extension
    pkgs.php83Extensions.mbstring    # PHP mbstring extension (required by Laravel)
    pkgs.php83Extensions.tokenizer   # PHP tokenizer extension (required by Laravel)
    pkgs.php83Extensions.xml         # XML extension (required by Laravel)
    pkgs.php83Extensions.zip         # ZIP extension (required by Laravel)
  ];

  # Environment variables for Composer
  shellHook = ''
    export COMPOSER_ALLOW_SUPERUSER=1
  '';
}

