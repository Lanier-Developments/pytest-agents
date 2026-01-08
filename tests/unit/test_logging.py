"""Unit tests for logging utilities."""

import logging
from pathlib import Path

import pytest

from pytest_agents.utils.logging import setup_logger


@pytest.mark.unit
class TestLoggingUtilities:
    """Test cases for logging utilities."""

    def test_setup_logger_basic(self) -> None:
        """Test basic logger setup."""
        logger = setup_logger("test_logger")

        assert isinstance(logger, logging.Logger)
        assert logger.name == "test_logger"
        assert logger.level == logging.INFO
        assert len(logger.handlers) >= 1

    def test_setup_logger_with_custom_level(self) -> None:
        """Test logger setup with custom level."""
        logger = setup_logger("test_logger_debug", level="DEBUG")

        assert logger.level == logging.DEBUG

        logger_warning = setup_logger("test_logger_warning", level="WARNING")
        assert logger_warning.level == logging.WARNING

        logger_error = setup_logger("test_logger_error", level="ERROR")
        assert logger_error.level == logging.ERROR

    def test_setup_logger_with_lowercase_level(self) -> None:
        """Test logger handles lowercase level strings."""
        logger = setup_logger("test_logger_lowercase", level="debug")

        assert logger.level == logging.DEBUG

    def test_setup_logger_creates_console_handler(self) -> None:
        """Test that console handler is created."""
        logger = setup_logger("test_console_logger")

        # Should have at least one console handler
        console_handlers = [
            h for h in logger.handlers if isinstance(h, logging.StreamHandler)
        ]
        assert len(console_handlers) >= 1

        # Check console handler configuration
        console_handler = console_handlers[0]
        assert console_handler.level == logging.DEBUG
        assert console_handler.formatter is not None

    def test_setup_logger_with_file_handler(self, tmp_path: Path) -> None:
        """Test logger setup with file handler."""
        log_file = tmp_path / "test.log"

        logger = setup_logger("test_file_logger", log_file=log_file)

        # Should have both console and file handlers
        assert len(logger.handlers) >= 2

        # Check file handler exists
        file_handlers = [
            h for h in logger.handlers if isinstance(h, logging.FileHandler)
        ]
        assert len(file_handlers) == 1

        # Check file handler configuration
        file_handler = file_handlers[0]
        assert file_handler.level == logging.DEBUG
        assert file_handler.formatter is not None

        # Test that logging to file works
        logger.info("Test log message")
        assert log_file.exists()
        content = log_file.read_text()
        assert "Test log message" in content

    def test_setup_logger_creates_log_directory(self, tmp_path: Path) -> None:
        """Test that log directory is created if it doesn't exist."""
        log_dir = tmp_path / "logs" / "nested" / "directory"
        log_file = log_dir / "test.log"

        # Directory should not exist yet
        assert not log_dir.exists()

        logger = setup_logger("test_dir_logger", log_file=log_file)

        # Directory should be created
        assert log_dir.exists()
        assert log_dir.is_dir()

        # Test logging works
        logger.info("Creating directories works")
        assert log_file.exists()

    def test_setup_logger_clears_existing_handlers(self) -> None:
        """Test that calling setup_logger multiple times clears old handlers."""
        logger_name = "test_clear_handlers"

        # Setup logger first time
        logger1 = setup_logger(logger_name)
        handler_count_1 = len(logger1.handlers)

        # Setup same logger again
        logger2 = setup_logger(logger_name)

        # Should be same logger instance (same name)
        assert logger1 is logger2

        # Handler count should be same (old ones cleared, new ones added)
        assert len(logger2.handlers) == handler_count_1

    def test_setup_logger_file_formatter_includes_function_and_line(
        self, tmp_path: Path
    ) -> None:
        """Test that file handler formatter includes function name and line number."""
        log_file = tmp_path / "detailed.log"

        logger = setup_logger("test_detailed_logger", log_file=log_file)

        # Log a message
        logger.info("Detailed log entry")

        # Check file content includes function name and line number
        content = log_file.read_text()
        assert "test_detailed_logger" in content
        assert "Detailed log entry" in content
        # File formatter should include funcName and lineno
        assert ":" in content  # Line number separator

    def test_setup_logger_multiple_loggers_independent(self, tmp_path: Path) -> None:
        """Test that multiple loggers are independent."""
        log_file_1 = tmp_path / "logger1.log"
        log_file_2 = tmp_path / "logger2.log"

        logger1 = setup_logger("logger_one", log_file=log_file_1)
        logger2 = setup_logger("logger_two", log_file=log_file_2)

        # Different logger instances
        assert logger1 is not logger2
        assert logger1.name != logger2.name

        # Log to each
        logger1.info("Message from logger 1")
        logger2.info("Message from logger 2")

        # Check files
        content1 = log_file_1.read_text()
        content2 = log_file_2.read_text()

        assert "Message from logger 1" in content1
        assert "Message from logger 2" in content2
        assert "Message from logger 2" not in content1
        assert "Message from logger 1" not in content2

    def test_setup_logger_level_affects_output(self, tmp_path: Path) -> None:
        """Test that log level filters messages appropriately."""
        log_file = tmp_path / "level_test.log"

        logger = setup_logger("test_level_logger", level="WARNING", log_file=log_file)

        # Log at different levels
        logger.debug("Debug message")
        logger.info("Info message")
        logger.warning("Warning message")
        logger.error("Error message")

        # Read file content
        content = log_file.read_text()

        # Only WARNING and above should be present
        assert "Debug message" not in content
        assert "Info message" not in content
        assert "Warning message" in content
        assert "Error message" in content
